// JavaScript for tab functionality
function openTab(tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Clean up every other active tablink
    tablinks = document.getElementsByClassName("tab-links");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    const currentTab = document.getElementsByClassName(`tab-${tabName}`)[0];
    currentTab.className += " active";

    const target = document.getElementById(tabName);
    target.style.display = "block";
    // if target doesn't have active class, add it
    if (!target.classList.contains("active")) {
        target.className += " active";
    }
    a = 1;
}