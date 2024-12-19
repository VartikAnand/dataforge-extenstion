class DataForge {
  constructor() {
    this.accessToken = null;
    this.linkedinUrl = "";
    this.savedLinkedinUrl = "";
    this.linkedinUrlData = {};
    this.init();
  }

  async init() {
    try {
      // Retrieve or update access token during initialization
      await this.retrieveAccessToken();

      const currentUrl = await this.getCurrentTabUrl();
      if (
        currentUrl &&
        currentUrl.includes("linkedin.com") &&
        currentUrl.includes("/in/")
      ) {
        this.showTab("tab1");
        await this.processTab1Logic();
      } else {
        this.showTab("tab2");
        await this.processTab2Logic();
      }
      this.bindTabButtons();
    } catch (error) {
      console.error("Initialization error:", error);
    }
  }

  // Method to show or hide the loading indicator
  showLoading(show) {
    $("#loading-indicator").toggle(show);
    $("#tab-content").toggle(!show);
  }

  // Method to retrieve the access token from the server
  async retrieveAccessToken() {
    try {
      const response = await $.ajax({
        url: "http://localhost:3000/api/v1/get/token",
        method: "GET",
        contentType: "application/json",
      });

      if (response?.data?.ApiKey) {
        const newToken = response.data.ApiKey;
        const storedToken = localStorage.getItem("df_accessToken");

        // Check if the token has changed and update it if necessary
        if (storedToken !== newToken) {
          console.log("Access token has changed. Updating local storage.");
          this.accessToken = newToken;
          localStorage.setItem("df_accessToken", newToken);
        } else {
          console.log("Access token matches the stored token.");
          this.accessToken = storedToken;
        }
      } else {
        throw new Error("API key not found in response.");
      }
    } catch (error) {
      if (error?.status === 404) {
        console.warn("404 error detected. Redirecting to app.dataforge.so...");
        window.open("http://localhost:3000/", "_blank");
      } else if (error?.status === 400) {
        console.warn(
          "400 error detected. Redirecting to app.dataforge.so in a new tab..."
        );
        window.open("http://localhost:3000/", "_blank");
      } else {
        console.error("Error retrieving access token:", error);
      }
    }
  }

  // Method to process the logic for Tab 1 (LinkedIn URL Data)
// Method to process the logic for Tab 1 (LinkedIn URL Data)
async processTab1Logic(linkedinProfileUrl = null) {
  try {
    this.showLoading(true);

    const profileUrl =
      linkedinProfileUrl || (await this.getAndDisplayLinkedInUrl());
    if (!profileUrl) {
      throw new Error("No valid LinkedIn URL found.");
    }

    // Ensure access token is updated
    if (!this.accessToken) {
      await this.retrieveAccessToken();
    }

    // Retrieve LinkedIn URL data
    const linkedinUrlData = await this.retrieveLinkedInUrlData(
      this.accessToken,
      profileUrl
    );

    if (!linkedinUrlData) {
      throw new Error("Failed to retrieve LinkedIn data.");
    }

    const storedData = JSON.parse(localStorage.getItem("linkedinData")) || {};

    // Check if the profile URL already exists in stored data
    if (!storedData[profileUrl]) {
      // If profile URL does not exist, store the new data
      storedData[profileUrl] = linkedinUrlData;
      localStorage.setItem("linkedinData", JSON.stringify(storedData));
      console.log("Profile URL data stored successfully.");
    } else {
      console.log("Profile URL already exists in localStorage.");
    }

    await this.updateUI(linkedinUrlData);
  } catch (error) {
    console.error("Error processing LinkedIn data:", error);

    // Display error message to the user in the center of the screen
    this.showErrorMessage("Failed to retrieve LinkedIn data. Please check your dashboard for further information.");
  } finally {
    this.showLoading(false);
  }
}

// Method to show an error message in the center of the screen
showErrorMessage(message) {
  const errorDiv = $("<div></div>")
    .attr("id", "error-message")
    .text(message)
    .css({
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "#ff4e4e",
      color: "#fff",
      padding: "20px",
      borderRadius: "5px",
      fontSize: "18px",
      textAlign: "center",
      zIndex: "9999",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    });

  $("body").append(errorDiv);

  // Automatically remove the message after 5 seconds (optional)
  setTimeout(() => {
    $("#error-message").fadeOut(500, () => {
      $(this).remove();
    });
  }, 5000);
}


  // Method to retrieve LinkedIn URL data based on access token and URL
  async retrieveLinkedInUrlData(accessToken, url, retries = 3) {
    try {
      if (!url) {
        throw new Error("LinkedIn URL is invalid or missing.");
      }

      const payload = {
        firstName: "",
        lastName: "",
        company: "",
        linkedinUrl: url,
        searchOptions: {
          findIndividualEmail: false,
          getCompanyEmails: false,
          findPhoneNumber: false,
          enrichLinkedIn: true,
        },
      };

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const response = await $.ajax({
            url: "http://localhost:3000/api/v3/get-info",
            method: "POST",
            contentType: "application/json",
            headers: { Authorization: `${accessToken}` },
            data: JSON.stringify(payload),
          });

          if (response) {
            if (response.status === false) {
              alert(response.message);
              return null;
            }
            return response?.socialEnrichment || null;
          }
        } catch (error) {
          if (attempt === retries) {
            throw error; // Rethrow the error if all retries fail
          }
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    } catch (error) {
      console.error("Error retrieving LinkedIn URL data after retries:", error);
      return null;
    }
  }

  // Method to process logic for Tab 2 (displaying stored LinkedIn profiles)
  async processTab2Logic() {
    try {
      this.showLoading(true);

      const storedData = JSON.parse(localStorage.getItem("linkedinData")) || {};
      const linkedinProfiles = Object.values(storedData);

      const fetchDataContainer = $("#fetch-linkedin-data");
      fetchDataContainer.empty();

      if (linkedinProfiles.length) {
        linkedinProfiles.forEach((profile) => {
          const cardHtml = `
            <div class="profile-card" data-social-url="${profile.social_url}">
              <div class="card-header">
                <img src="${
                  profile.picture || "../assets/icons/placeholder.png"
                }" alt="User Picture" />
                <div>
                  <h4>${profile.first_name} ${profile.last_name}</h4>
                  <a href="#" class="view-link" data-url="${
                    profile.social_url
                  }">view</a>
                </div>
              </div>
            </div>
          `;
          fetchDataContainer.append(cardHtml);
        });

        $(".view-link").on("click", (event) => {
          event.preventDefault();
          const profileUrl = $(event.currentTarget).data("url");
          this.showTab("tab1");
          this.processTab1Logic(profileUrl);
        });
      } else {
        fetchDataContainer.append(
          "<p>No profiles found. Add data in Tab 1 first.</p>"
        );
      }
    } catch (error) {
      console.error("Error processing Tab 2 data:", error);
    } finally {
      this.showLoading(false);
    }
  }

  // Method to update the UI with retrieved LinkedIn data
  // Method to update the UI with retrieved LinkedIn data
  // Method to update the UI with retrieved LinkedIn data
  async updateUI(data) {
    try {
      if (!data) {
        throw new Error("No data available to update UI.");
      }

      $("#user-name").text(`${data.first_name} ${data.last_name}`);
      $("#user-picture").show();
      $("#user-picture").attr(
        "src",
        data.picture || "../assets/icons/placeholder.png"
      );
      $("#user-title").text(data.job_title || "No title available");
      $("#user-summary").html(data.summary || "No summary available");
      $("#user-skills").text(`Skills: ${data.skills || "No skills listed"}`);
      $("#user-linkedin-url").attr("href", data.linkedin || "#");

      const workExperienceContainer = $(".work-experience");
      workExperienceContainer.empty();
      if (Array.isArray(data.workExperience) && data.workExperience.length) {
        data.workExperience.forEach((experience) => {
          workExperienceContainer.append(`
          <div class="experience">
            <img src="${
              experience.companyLogo || "../assets/icons/placeholder.png"
            }" alt="${
            experience.companyName || "Unknown"
          } Logo" class="company-logo" />
            <div class="experience-info">
              <p><strong>Company:</strong> <a href="${
                experience.companyUrl || "#"
              }" target="_blank">${experience.companyName || "N/A"}</a></p>
              <p><strong>Role:</strong> ${experience.title || "N/A"}</p>
              <p><strong>Started:</strong> ${
                experience.startMonth || "Unknown"
              } ${experience.startYear || ""}</p>
              <p><strong>Description:</strong> ${
                experience.description || "No description available."
              }</p>
            </div>
          </div>
        `);
        });
      } else {
        workExperienceContainer.append("<p>No work experience available.</p>");
      }

      const educationContainer = $(".education");
      educationContainer.empty();
      if (Array.isArray(data.education) && data.education.length) {
        data.education.forEach((education) => {
          educationContainer.append(
            `<p>${education.schoolName || "Unknown school"}</p>`
          );
        });
      } else {
        educationContainer.append("<p>No education details available.</p>");
      }

      // Email and Mobile Toggle Button with a structured display
      $(".contact-info").html(`
       <button class="toggle-info-btn" data-type="email">Reveal Email</button></p>
      <div id="email-info" style="display: none; font-weight: normal;"></div>
       <button class="toggle-info-btn" data-type="mobile">Reveal Mobile</button></p>
      <div id="mobile-info" style="display: none; font-weight: normal;"></div>
    `);

      // Event listener for toggle buttons
      $(".toggle-info-btn").on("click", function () {
        const type = $(this).data("type");

        // If it's the email button
        if (type === "email") {
          if ($("#email-info").is(":visible")) {
            // If already visible, hide it and change button text to Reveal
            $("#email-info").hide();
            $(this).text("Reveal");
          } else {
            // Otherwise, show email and change button text to Hide
            if (data.email?.email) {
              $("#email-info")
                .html(
                  `<span>Email: <a href="mailto:${data.email.email}">${data.email.email}</a></span>`
                )
                .show();
            } else {
              $("#email-info").html("<span>No email available.</span>").show();
            }
            $(this).text("Hide Information");
          }
        }

        // If it's the mobile button
        if (type === "mobile") {
          if ($("#mobile-info").is(":visible")) {
            // If already visible, hide it and change button text to Reveal
            $("#mobile-info").hide();
            $(this).text("Reveal");
          } else {
            // Otherwise, show mobile and change button text to Hide
            if (data.mobile) {
              $("#mobile-info")
                .html(
                  `<span>Mobile: <a href="tel:${data.mobile}">${data.mobile}</a></span>`
                )
                .show();
            } else {
              $("#mobile-info")
                .html("<span>No mobile number available.</span>")
                .show();
            }
            $(this).text("Hide");
          }
        }
      });
    } catch (error) {
      console.error("Error updating UI:", error);
    }
  }

  // Method to show specific tabs based on user action
  showTab(tabId) {
    try {
      $(".tab-content").hide();
      $(`#${tabId}`).show();
      $(".tab-button").removeClass("active");
      $(`[data-tab="${tabId}"]`).addClass("active");

      // Trigger logic based on the tab
      if (tabId === "tab2") {
        this.processTab2Logic();
      }
    } catch (error) {
      console.error("Error showing tab:", error);
    }
  }

  // Method to bind tab buttons to actions
  bindTabButtons() {
    try {
      $(".tab-button").on("click", async (event) => {
        const tabId = $(event.currentTarget).data("tab");
        this.showTab(tabId);
        if (tabId === "tab1") {
          await this.processTab1Logic();
        }
      });
    } catch (error) {
      console.error("Error binding tab buttons:", error);
    }
  }

  // Method to get and display the current LinkedIn URL
  async getAndDisplayLinkedInUrl() {
    try {
      const url = await this.getCurrentTabUrl();
      if (!url) {
        throw new Error("Failed to retrieve current tab URL.");
      }
      return url;
    } catch (error) {
      console.error("Error retrieving and displaying LinkedIn URL:", error);
      return null;
    }
  }

  // Method to get the current URL of the active tab
  async getCurrentTabUrl() {
    return new Promise((resolve) => {
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          let currentUrl = tabs[0]?.url || "No URL Found";

          // Check if the URL is a LinkedIn profile
          if (
            currentUrl.includes("linkedin.com") &&
            currentUrl.includes("/in/")
          ) {
            // Remove the trailing slash if it exists
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
}

// Initialize the DataForge class once the document is ready
$(document).ready(() => {
  new DataForge();
});
