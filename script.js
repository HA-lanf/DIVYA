document.querySelector("form").addEventListener("submit", function(event) {
    event.preventDefault();

    const username = document.querySelector("#username").value.trim();
    const message = document.querySelector("#message").value.trim();

    if (!username || !message) {
        alert("Please fill both username and message");
        return;
    }

    fetch("/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, message })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.querySelector("#message").value = ""; // clear message only
            alert("Message sent successfully!");
        } else {
            alert("USER NOT FOUND");
            document.querySelector("#username").value = "";
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
    });
});
