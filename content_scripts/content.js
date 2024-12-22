$(document).ready(function () {
  // Create the floating button
  const floatingButton = $('<button>')
    .attr('id', 'my-extension-floating-button')
    .text('DataForge')
    .css({
      position: 'fixed',
      top: '50%', // Middle of the screen
      right: '10px',
      transform: 'translateY(-50%) ',
      rotate: '90deg',
      zIndex: 10000,
      backgroundColor: '#415285', // LinkedIn primary color
      color: '#fff',
      border: 'none',
      borderRadius: '5px',
      padding: '10px 15px',
      cursor: 'pointer',
      boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.2)',
    });

  // Append the button to the body
  $('body').append(floatingButton);

  // Button click handler to open the Chrome extension
  $('#my-extension-floating-button').on('click', function () {
    chrome.runtime.sendMessage({ action: 'openExtension' });
  });
});
