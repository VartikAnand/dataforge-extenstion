class DataForge {
  constructor() {
    this.currentPage = 1;
    this.mainContainer = jQuery("#dv-tab-content");
    this.tabButtons = jQuery(".dv-tab-button");
    this.loader = jQuery(".dv-loader");
    this.loginButton = jQuery(".df-login-container");
    this.bottomTabMenu = jQuery("#dv-tab-menu");
    this.errorMsg = jQuery("#dv-error-msg");
    this.tab1ButtonGroup = jQuery("#dv-tab1-content");
    this.mainCard = jQuery("#dv-data-card");
    this.tab2Content = jQuery("#dv-tab2-content");

    this.loginButton.hide();
    this.mainContainer.hide();
    this.loader.hide();

    this.accessToken = null;
    this.linkedinUrl = "";
    this.linkedinUrlData = {
      firstName: "",
      lastName: "",
      linkedinUrl: "",
      summary: "",
    };
    this.loginPageUrl = "https://example.com/login";
    this.apiTokenUrl = "http://localhost:3000/api/v1/get/token";
    this.prodTokenUrl = "https://app.dataforge.so/api/v1/get/token";
    this.signInUrl = "https://app.dataforge.so/sign-in";
    this.checkAndSetAccessToken();
    this.install();
    this.initializeTabs();

    // Periodically update LinkedIn URL
  }

  // Method to check and set the access token
  checkAndSetAccessToken() {
    const token = localStorage.getItem("accessToken");
    if (token) {
      this.accessToken = token;
    } else {
      this.accessToken = null;
    }
  }

  async install() {
    await this.updateLinkedInUrl();

    if (this.accessToken) {
      this.setupUI();
      return;
    }
    this.mainContainer.hide();
    this.bottomTabMenu.hide();
    this.loginButton.show();
    this.loginButton.on("click", async () => await this.handleLoginClick());
  }

  setupUI() {
    this.mainContainer.show();
    this.tabButtons.prop("disabled", false);
  }

  async fetchAccessToken() {
    try {
      const response = await jQuery.ajax({
        url: this.prodTokenUrl,
        method: "GET",
        contentType: "application/json",
      });
      return response;
    } catch (error) {
      console.error("Error retrieving access token:", error);
    }
  }

  initializeButtons() {
    jQuery("#df-email").on("click", async () => await this.handleEmailClick());
    jQuery("#df-contact").on(
      "click",
      async () => await this.handleContactClick()
    );
    jQuery("#df-enrichUrl").on(
      "click",
      async () => await this.handleEnrichUrlClick()
    );
  }

  async handleLoginClick() {
    this.loginButton.hide();
    try {
      this.loader.show();
      const response = await this.fetchAccessToken();
      console.log("Response Status Code:", response.status);
      console.log("Full Response:", response);
      if (response?.data?.ApiKey) {
        this.loader.hide();
        this.handleSuccessfulLogin(response.data.ApiKey);
        this.setupUI();
      } else {
        throw new Error("API key not found in response.");
      }
    } catch (error) {
      console.error("Error retrieving access token:", error);
      alert("Login Your account to continue..");
      window.open(this.signInUrl, "_blank");
    }
  }

  handleSuccessfulLogin(token) {
    localStorage.setItem("accessToken", token);
    this.accessToken = token;
    console.log("Access token successfully retrieved and stored.");
  }

  initializeTabs() {
    console.log("Initializing tabs..."); // Log when tabs initialization starts

    jQuery("#dv-tab-menu .dv-tab-button").on("click", async (event) => {
      const targetTab = jQuery(event.target).data("tab");

      // Log the value of targetTab
      console.log("Clicked tab data-tab value:", targetTab);

      if (!targetTab) {
        console.error("Error: No data-tab value found.");
        return; // If no data-tab value is found, exit
      }

      console.log(`Tab clicked: ${targetTab}`); // Log the clicked tab

      // Check if the clicked tab is already active, if so, disable the click
      if (jQuery(event.target).hasClass("active")) {
        console.log(`Tab "${targetTab}" is already active. No action taken.`); // Log if the tab is already active
        return; // Exit the function if the tab is already active
      }

      // If the tab is not active, proceed with switching
      console.log(`Switching to tab: ${targetTab}`); // Log the tab switch action
      await this.switchTab(targetTab);
    });
  }

  async switchTab(targetTab) {
    console.log(`Switching to ${targetTab}...`); // Log when switching tabs

    jQuery("#dv-tab-menu .dv-tab-button").removeClass("active");
    jQuery(`[data-tab="${targetTab}"]`).addClass("active");
    jQuery("#dv-tab-content .dv-tab-content").removeClass("active");
    jQuery(`#dv-${targetTab}-content`).addClass("active");

    // Fetch data for Tab 2 (List Tab) when switched
    if (targetTab === "tab2") {
      console.log("Fetching data for Tab 2...");
      await this.fetchDataForListTab();
    }
  }

  async fetchDataForListTab() {
    console.log("Starting data fetch for List Tab..."); // Log when data fetching starts
    this.loader.show();
    try {
      const response = await this.fetchData(this.currentPage);

      // Check if the response is valid and contains data
      if (response && response.resData) {
        console.log(
          `Data fetched successfully for page ${this.currentPage}:`,
          response.resData
        );
        this.displayListData(response.resData); // Display the fetched data
        this.setupPagination(response.pagination.totalPages); // Setup pagination
      } else {
        console.warn("No data found in the response."); // Use warn for better debugging
        this.errorMsg.text("No data found.");
        this.errorMsg.show();
      }
    } catch (error) {
      console.error("Error fetching data:", error); // Log any error during the data fetch
      this.errorMsg.text("An error occurred while fetching the data.");
      this.errorMsg.show();
    } finally {
      console.log("Data fetch complete.");
      this.loader.hide();
    }
  }

  // Function to fetch data from the API
  async fetchData(pageNumber) {
    console.log(`Fetching data for page: ${pageNumber}`); // Log the page number being fetched
    const headers = {
      Authorization: `${this.accessToken}`,
    };
    try {
      const response = await jQuery.ajax({
        url: `http://localhost:3000/api/v4/get/ce-social-list?page=${pageNumber}`,
        method: "GET",
        headers: headers,
        contentType: "application/json",
      });
      console.log(`API response received for page ${pageNumber}:`, response); // Log the API response
      return response;
    } catch (error) {
      console.error("Error fetching data from API:", error); // Log error from API
      return null;
    }
  }

  displayListData(data) {
    let cardsHTML = ""; 
    data.forEach((item) => {
        cardsHTML += `
            <div class="chat-card">
                <div class="profile-pic">
                    <img src="${item.picture || 'https://via.placeholder.com/50'}" alt="${item.full_name || 'Profile Picture'}">
                </div>
                <div class="chat-info">
                    <div class="profile-name">${item.full_name || 'Unknown Name'}</div>
                    <div class="job-title">${item.job_title || 'No Job Title Provided'}</div>
                </div>
            </div>
        `;
    });

    console.log("Appending cards to Tab 2 content..."); // Log before appending data
    this.tab2Content.html(cardsHTML); // Append the cards to Tab 2 content
}


  setupPagination(totalPages) {
    console.log("Setting up pagination..."); // Log when setting up pagination
    let paginationHTML = "";
    for (let i = 1; i <= totalPages; i++) {
      paginationHTML += `<button class="pagination-btn" data-page="${i}">${i}</button>`;
    }

    this.tab2Content.append(`
      <div class="pagination-container">
        ${paginationHTML}
      </div>
    `);

    // Bind click event for pagination buttons
    console.log("Binding click event for pagination buttons..."); // Log when binding pagination click events
    jQuery(".pagination-btn").on("click", (event) => {
      const pageNumber = jQuery(event.target).data("page");
      console.log(`Pagination button clicked: Page ${pageNumber}`); // Log the page number clicked
      this.currentPage = pageNumber; // Update current page
      this.fetchDataForListTab(); // Fetch data for the new page
    });
  }

  async getCurrentTabUrl() {
    return new Promise((resolve) => {
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          let currentUrl = tabs[0]?.url || "No URL Found";

          if (
            currentUrl.includes("linkedin.com") &&
            currentUrl.includes("/in/")
          ) {
            currentUrl = currentUrl.endsWith("/")
              ? currentUrl.slice(0, -1)
              : currentUrl;
            resolve(currentUrl);
          } else {
            resolve(null);
          }
        });
      } catch (error) {
        console.error("Error getting current tab URL:", error);
        resolve(null);
      }
    });
  }

  // Method to get and update the LinkedIn URL

  async updateLinkedInUrl() {
    try {
      const url = await this.getCurrentTabUrl();
      if (url) {
        this.linkedinUrl = url;
        this.processLinkedInUrl();
      }
    } catch (error) {
      console.error("Error updating LinkedIn URL:", error);
    }
    // setTimeout(() => this.updateLinkedInUrl(), 5000);
  }
  async processLinkedInUrl() {
    if (this.linkedinUrl) {
      console.log("Processing LinkedIn URL:", this.linkedinUrl);
      this.loader.show();
      this.loader.children().last().text("🔍 Please wait a moment...");

      let fetchData;
      let payload1 = {
        linkedinUrl: this.linkedinUrl,
        searchOptions: {
          findPhoneNumber: true,
          enrichLinkedIn: true,
        },
      };

      try {
        fetchData = await this.fetchInitialData();
        console.log("Before...");
        console.log(fetchData);

        if (!fetchData) {
          this.loader.children().last().text("🚧 Processing...");

          console.log("404 Error: Resource not found.");

          const getInitialData = await this.getInitialData(payload1);
          console.log(getInitialData);

          if (getInitialData) {
            console.log("After Inserting data");
            this.loader
              .children()
              .last()
              .text("⏳ Hold on a sec... We're almost done!");
            fetchData = await this.fetchInitialData();
            console.log(fetchData);
          } else {
            this.errorMsg.show();
            this.errorMsg.text("🚨 Something went wrong!!!");
            setTimeout(() => {
              this.errorMsg.text("⚠️ Try again later!");
              this.errorMsg.hide();
            }, 2000);
          }
        }

        if (fetchData) {
          this.showLinkedInCard(fetchData.resData);
        } else {
          this.errorMsg.show();
          this.errorMsg.text("Resource not found.");
          setTimeout(() => {
            this.errorMsg.hide();
          }, 2000);
        }
      } catch (error) {
        console.error("Error processing LinkedIn URL:", error);
        this.errorMsg.show();
        this.errorMsg.text("⚠️ Error occurred while processing.");
      } finally {
        this.loader.hide();
      }
    }
  }

  showLinkedInCard(resData) {
    const { full_name, picture, job_title, social_url, summary } = resData;
    const profilePicture = picture ? picture : "https://via.placeholder.com/80";

    const cardHTML = `
    <div class="linkedin-card">
            <div class="linkedin-card-header">
                <img src="https://www.linkedin.com/favicon.ico" alt="LinkedIn" class="linkedin-logo">
                <img src="${profilePicture}" alt="${full_name}" class="linkedin-card-avatar">
            </div>
            <div class="linkedin-card-body">
                <h2 class="linkedin-card-name">${full_name}</h2>
                <p class="linkedin-job-title">${job_title}</p>
            </div>
        <div class="linkedin-card-btn">
        <button  id="df-enrichUrl"  class="dv-tab-button">Enriched Profile</button>
            <div id="enrichUrlCard"></div>
        <button  id="df-email" class="dv-tab-button">Reveal Email</button>
            <div id="emailCard"></div>
        <button id="df-contact"class="dv-tab-button">Reveal Contact</button>
             <div id="contactCard"></div>

      </div>
    `;

    this.mainCard.html(cardHTML);
    this.initializeButtons();
  }

  initializeButtons() {
    jQuery("#df-email").on("click", async () => await this.handleEmailClick());
    jQuery("#df-contact").on(
      "click",
      async () => await this.handleContactClick()
    );
    jQuery("#df-enrichUrl").on(
      "click",
      async () => await this.handleEnrichUrlClick()
    );
  }

  async handleEmailClick() {
    this.tabButtons.prop("disabled", true);
    this.loader.show();
    this.loader.children().last().text("🚧 Extracting Email...");
    try {
      const emailData = await this.fetchInitialData(true);

      if (!emailData || !emailData.resData) {
        console.log("No data");
        jQuery("#emailCard").html("<p>No email found</p>");
      } else {
        const email = emailData.resData.email.email || "No email available";
        const EmailCardHTML = `<div class="dv-email-container"> 
        <a href="mailto:${email}" class="dv-email-link">${email}</a>
        </div>`;
        jQuery("#emailCard").html(EmailCardHTML);
      }
    } catch (error) {
      console.error("Error in handleEmailClick:", error);
      jQuery("#emailCard").html(
        "<p>There was an error fetching the email.</p>"
      );
    } finally {
      this.tabButtons.prop("disabled", false);
      this.loader.hide();
    }
  }

  async handleContactClick() {
    this.tabButtons.prop("disabled", true);
    this.loader.show();
    this.loader.children().last().text("🚧 Extracting Contact...");

    try {
      const mobileData = await this.fetchInitialData(false, true);

      if (!mobileData || !mobileData.resData || !mobileData.resData.mobile) {
        console.log("No data");
        jQuery("#contactCard").html("<p>No contact found</p>");
      } else {
        const mobile =
          mobileData.resData.mobile.international_format ||
          "No contact available";
        const MobileCardHTML = `
          <div class="dv-mobile-container">
            <a href="tel:${mobile}" class="dv-mobile-link">${mobile}</a>
          </div>`;
        jQuery("#contactCard").html(MobileCardHTML);
      }
    } catch (error) {
      console.error("Error in handleContactClick:", error);
      jQuery("#contactCard").html(
        "<p>There was an error fetching the contact.</p>"
      );
    } finally {
      this.tabButtons.prop("disabled", false);
      this.loader.hide();
    }
  }

  async handleEnrichUrlClick() {
    this.tabButtons.prop("disabled", true);
    this.loader.show();
    this.loader.children().last().text("🚧 Extracting Current profile...");

    try {
      const linkedinData = await this.fetchInitialData(false, false, true);

      console.log(linkedinData);
      if (!linkedinData || !linkedinData.resData) {
        console.log("No data");
        jQuery("#enrichUrlCard").html("<p>Something went wrong !!!</p>");
      } else {
        const { full_name, job_title, social_url, picture, workExperience } =
          linkedinData.resData;

        const workExperienceHTML = workExperience
          .map(
            (experience) => `
          <div class="work-experience">
            <img src="${experience.companyLogo}" alt="${experience.companyName}" class="company-logo">
            <div class="experience-details">
              <a href="${experience.companyUrl}" target="_blank" class="company-name">${experience.companyName}</a>
              <p class="title">${experience.title} - ${experience.location}</p>
              <p class="employment-type">${experience.employmentType}</p>
            </div>
          </div>
        `
          )
          .join("");

        const profileHTML = `
          <div class="profile-container">
            <div class="work-experience-section">
              <h3>Work Experience</h3>
              ${workExperienceHTML}
            </div>
          </div>
        `;

        jQuery("#enrichUrlCard").html(profileHTML);
      }
    } catch (error) {
      console.error("Error in handleContactClick:", error);
      jQuery("#enrichUrlCard").html("<p>There was an error fetching ...</p>");
    } finally {
      this.tabButtons.prop("disabled", false);
      this.loader.hide();
    }
  }

  async getInitialData(payload) {
    const headers = {
      Authorization: `${this.accessToken}`,
    };
    try {
      const response = await jQuery.ajax({
        url: "http://localhost:3000/api/v4/get-info",
        method: "POST",
        contentType: "application/json",
        headers: headers,
        data: JSON.stringify(payload),
      });
      console.log("API Response:", response);
      return response;
    } catch (error) {
      console.error("Error in getInitialData:", error);
      return null;
    }
  }

  async fetchInitialData(isEmail = false, isMobile = false, isEnrich = false) {
    const sanitizedUrl = this.removeTrailingSlash(this.linkedinUrl);
    const payload = {
      social_url: sanitizedUrl,
      isEmail: isEmail,
      isMobile: isMobile,
      isEnrich: isEnrich,
    };
    const apiUrl = "https://app.dataforge.so/api/v4/get/ce-social/";

    const headers = {
      Authorization: `${this.accessToken}`,
    };

    try {
      const response = await jQuery.ajax({
        url: apiUrl,
        method: "POST",
        contentType: "application/json",
        headers: headers,
        data: JSON.stringify(payload),
      });
      console.log("Fetch Initial Data Response:", response);
      return response;
    } catch (error) {
      console.error("Error in fetchInitialData:", error);
      return null;
    }
  }

  removeTrailingSlash(url) {
    if (url.endsWith("/")) {
      return url.slice(0, -1);
    }
    return url;
  }
}

jQuery(document).ready(() => {
  new DataForge();
});
