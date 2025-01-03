class DataForge {
  constructor() {
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
    this.loginButton = null;

    this.install();
  }

  async install() {
    try {
      // Perform AJAX request to retrieve the access token
      const response = await this.fetchAccessToken();

      // Handle response and decide UI actions
      if (
        response?.data?.status === false &&
        response?.data?.error === "User not found !!!"
      ) {
        this.setupUI();
      } else if (response?.data?.ApiKey) {
        this.handleSuccessfulLogin(response.data.ApiKey);
      } else {
        throw new Error("API key not found in response.");
      }
    } catch (error) {
      console.error("Error retrieving access token:", error);
    }
  }

  async fetchAccessToken() {
    return await $.ajax({
      url: this.apiTokenUrl,
      method: "GET",
      contentType: "application/json",
    });
  }

  setupUI() {
    // Append and position the login button
    this.createLoginButton();
    this.appendLoginButtonToApp();
    this.centerLoginButton();
  }

  createLoginButton() {
    this.loginButton = $("<button>", {
      text: "Login",
      id: "loginButton",
      class: "btn btn-primary",
      click: () => window.open(this.loginPageUrl, "_blank"), // Add click event to open URL
    });
  }

  appendLoginButtonToApp() {
    $("#df-app").css("position", "relative").append(this.loginButton);
    this.loginButton.show();
  }

  centerLoginButton() {
    // Center the login button in the #df-app div
    $("#loginButton").css({
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    });
  }

  handleSuccessfulLogin(token) {
    // On success, store the token in local storage
    localStorage.setItem("accessToken", token);
    this.accessToken = token; // Update the class variable
    console.log("Access token successfully retrieved and stored.");
  }
}

// Initialize the DataForge class
$(document).ready(() => {
  const dataForgeInstance = new DataForge();
  console.log("DataForge instance initialized:", dataForgeInstance);
});
