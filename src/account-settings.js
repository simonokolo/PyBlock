import { checkAuthForAccountSettings, updateUserProfile, updateUserPassword, reauthenticateUser, generateDeletionCode, deleteAccount } from '/src/auth.js';

document.addEventListener('DOMContentLoaded', () => {
	checkAuthForAccountSettings();
	const code = generateDeletionCode();

	const popup = document.getElementById('authentication-popup');
	const closeButton = document.getElementById('close-button');

	function hidePopup() {
		popup.classList.remove('active');
	}

	// Make close button work on popup
	closeButton.addEventListener('click', hidePopup);
	
	// Add event listener for back button
	document.getElementById('back-button').addEventListener('click', function() { 
			window.location.href = "/pages/workspace.html" 
	})

	// Event listener for updating the users displayName
	document.getElementById('username-email-form').addEventListener('submit', updateUserProfile);

	// Event listener for updating the users password
	document.getElementById('change-password-form').addEventListener('submit', updateUserPassword);

	// Event listener for the reauthentication form
	document.getElementById('authentication-form').addEventListener('submit', reauthenticateUser);

	// Event listener for the delete account button
	document.getElementById('delete-account-button').addEventListener('click', function() {
		const deletionCodeInput = parseInt(document.getElementById('deletion-code-input').value.trim());

		if (deletionCodeInput === code) {
			console.log("Correct deletion code")
      deleteAccount()
		} else {
			console.log("Incorrect deletion code", code)
      alert("Incorrect Deletion Code")
		}
	})
});
