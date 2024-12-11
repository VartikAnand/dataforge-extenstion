class DataForge {
  constructor() {
    this.accessToken = localStorage.getItem("df_accessToken") || null;
    this.linkedinUrl = "";
    this.savedLinkedinUrl = "";
    this.linkedinUrlData = {};
    this.init();
  }

  async init() {
    try {
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

  showLoading(show) {
    $("#loading-indicator").toggle(show);
    $("#tab-content").toggle(!show);
  }

  async processTab1Logic(linkedinProfileUrl = null) {
    try {
      this.showLoading(true);

      const profileUrl =
        linkedinProfileUrl || (await this.getAndDisplayLinkedInUrl());
      if (!profileUrl) {
        throw new Error("No valid LinkedIn URL found.");
      }

      if (!this.accessToken) {

        await this.retrieveAccessToken();
      }


    

      const linkedinUrlData = await this.retrieveLinkedInUrlData(
        this.accessToken,
        profileUrl
      );
      if (!linkedinUrlData) {
        throw new Error("Failed to retrieve LinkedIn data.");
      }

      const storedData = JSON.parse(localStorage.getItem("linkedinData")) || {};

      console.log(storedData);
      // Check if the profile URL already exists in stored data
      if (storedData[profileUrl]) {
        console.log(
          "Profile URL already exists in localStorage. No update needed."
        );
      } else {
        // If profile URL does not exist, store the new data
        storedData[profileUrl] = linkedinUrlData;
        localStorage.setItem("linkedinData", JSON.stringify(storedData));
        console.log("Profile URL data stored successfully.");
      }

      await this.updateUI(linkedinUrlData);
    } catch (error) {
      console.error("Error processing LinkedIn data", error);
    } finally {
      this.showLoading(false);
    }
  }

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
            url: "https://app.dataforge.so/api/v3/get-info",
            method: "POST",
            contentType: "application/json",
            headers: { Authorization: `${accessToken}` },
            data: JSON.stringify(payload),
          });
          console.log("Response:", JSON.stringify(response.socialEnrichment));
          return response?.socialEnrichment || null;
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
  

  async retrieveAccessToken() {
    try {
      const response = await $.ajax({
        url: "https://app.dataforge.so/api/v1/get/token",
        method: "GET",
        contentType: "application/json",
      });
  
      if (response?.data?.ApiKey) {
        this.accessToken = response.data.ApiKey;
        localStorage.setItem("df_accessToken", response.data.ApiKey);
      } else {
        throw new Error("API key not found in response.");
      }
    } catch (error) {
      if (error?.status === 404) {
        console.warn("404 error detected. Redirecting to app.dataforge.so...");
        window.open("https://app.dataforge.so/", "_blank"); // Opens in a new tab
      } else if (error?.status === 400) {
        console.warn("400 error detected. Redirecting to app.dataforge.so in a new tab...");
        window.open("https://app.dataforge.so/", "_blank"); // Opens in a new tab
      } else {
        console.error("Error retrieving access token:", error);
      }
    }
  }
  

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
      educationContainer.append();
      if (Array.isArray(data.education) && data.education.length) {
        data.education.forEach((education) => {
          educationContainer.append(
            `<p>${education.schoolName || "Unknown school"}</p>`
          );
        });
      } else {
        educationContainer.append("<p>No education details available.</p>");
      }

      $(".contact-info").html(`
        <p><strong>Email:</strong> <a href="mailto:${
          data.email?.email || "N/A"
        }">${data.email?.email || "N/A"}</a></p>
        <p><strong>Mobile:</strong> ${data.mobile || "Not available"}</p>
      `);
    } catch (error) {
      console.error("Error updating UI:", error);
    }
  }

  showTab(tabId) {
    try {
      $(".tab-content").hide();
      $(`#${tabId}`).show();
      $(".tab-button").removeClass("active");
      $(`[data-tab="${tabId}"]`).addClass("active");

      // Trigger logic based on the tab
      if (tabId === "tab2") {
        this.processTab2Logic(); // Add this line for Tab 2 logic
      }
    } catch (error) {
      console.error("Error showing tab:", error);
    }
  }

  bindTabButtons() {
    try {
      $(".tab-button").on("click", async (event) => {
        const tabId = $(event.currentTarget).data("tab");
        this.showTab(tabId);
        if (tabId === "tab1") {
          await this.processTab1Logic(); // Trigger Tab 1 logic on tab switch
        }
      });
    } catch (error) {
      console.error("Error binding tab buttons:", error);
    }
  }

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
          // this.savedLinkedinUrl = profileUrl;
          this.showTab("tab1");
          this.processTab1Logic(profileUrl); // Show the data for the clicked profile in Tab 1
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
            this.linkedinUrl = currentUrl;
          } else {
            this.linkedinUrl = "";
          }

          $("#linkedin-title").text(
            this.linkedinUrl || "Not a LinkedIn Profile URL"
          );
          resolve(this.linkedinUrl);
        });
      } catch (error) {
        console.error("Error getting current tab URL:", error);
        resolve(null);
      }
    });
  }
}

$(document).ready(() => {
  new DataForge();
});
