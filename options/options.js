

class DataForge {
  constructor() {
    this.mainContainer = jQuery('#dv-tab-content');
    this.tabButtons = jQuery(".dv-tab-button");
    this.loader = jQuery('.dv-loader');
    this.loginButton = jQuery(".df-login-container");
    this.bottomTabMenu = jQuery("#dv-tab-menu");
    this.loginButton.hide();
    this.mainContainer.hide();
    // this.tabButtons.prop("disabled", true);
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
    this.apiTokenUrl = "http://app.dataforge.so/api/v1/get/token";

    // this.getAndDisplayLinkedInUrl();
    this.checkAndSetAccessToken();
    this.install();
    this.initializeTabs();
    this.initializeButtons();
  }

  // Method to check and set the access token
  checkAndSetAccessToken() {
    // Check if there is an API key stored in localStorage
    const token = localStorage.getItem('accessToken');
    if (token) {
      // If token exists, set it to this.accessToken
      this.accessToken = token;
    } else {
      // If token doesn't exist, set this.accessToken to null
      this.accessToken = null;
    }
  }

  async install() {
    // Dynamically set the header text with `this.linkedinUrl`
    jQuery('#dv-app-header').text(`LinkedIn URL: ${this.linkedinUrl}`);

    if (this.accessToken) {
      this.setupUI();
      return;
    }
    this.bottomTabMenu.hide();

    // Ensure login button click event triggers token fetch
    this.loginButton.show();
    this.loginButton.on("click", async () => await this.handleLoginClick());
    // this.loginButton.on("click", async () => await this.handleEmailClick());
  }

  setupUI() {
    this.mainContainer.show();
    this.tabButtons.prop("disabled", false);
  }

  async fetchAccessToken() {
    return await jQuery.ajax({
      url: this.apiTokenUrl,
      method: "GET",
      contentType: "application/json",
    });
  }

  initializeButtons() {
    // Add click handlers for each specific button
    jQuery("#df-email").on("click", async () => await this.handleEmailClick());
    jQuery("#df-contact").on("click", async () => await this.handleContactClick());
    jQuery("#df-enrichUrl").on("click", async () => await this.handleEnrichUrlClick());
  }

  async handleLoginClick() {
    this.loginButton.hide();
    try {
      this.loader.show();
      // Trigger the API call to fetch the token
      const response = await this.fetchAccessToken();
      console.log(response.data);
      if (response?.data?.ApiKey) {
        this.loader.hide();
        this.handleSuccessfulLogin(response.data.ApiKey);
        this.setupUI();
      } else {
        throw new Error("API key not found in response.");
      }
    } catch (error) {
      console.error("Error retrieving access token:", error);
    }
  }

  // Button click handlers
  async handleEmailClick() {
    console.log("Email button clicked");
    // Add your logic here for the email button
  }

  async handleContactClick() {
    console.log("Contact button clicked");
    // Add your logic here for the contact button
  }

  async handleEnrichUrlClick() {
    console.log("Enrich URL button clicked");
    // Add your logic here for the enrich URL button
  }

  handleSuccessfulLogin(token) {
    localStorage.setItem("accessToken", token);
    // chrome.storage.local.set({ dfToken: token });
    this.accessToken = token;
    console.log("Access token successfully retrieved and stored.");
  }

  initializeTabs() {
    jQuery("#dv-tab-menu .dv-tab-button").on("click", async (event) => {
      const targetTab = jQuery(event.target).data("tab");
      await this.switchTab(targetTab);
    });
  }

  async switchTab(targetTab) {
    jQuery("#dv-tab-menu .dv-tab-button").removeClass("active");
    jQuery(`[data-tab="${targetTab}"]`).addClass("active");
    jQuery("#dv-tab-content .dv-tab-content").removeClass("active");
    jQuery(`#dv-${targetTab}-content`).addClass("active");
  }


  async getAndDisplayLinkedInUrl() {
    try {
      const url = await this.getCurrentTabUrl();
      if (!url) {
        throw new Error("Failed to retrieve current tab URL.");
      }
      this.linkedinUrl = url;
    } catch (error) {
      console.error("Error retrieving and displaying LinkedIn URL:", error);
      this.linkedinUrl = '';
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

jQuery(document).ready(() => {
  new DataForge();
});