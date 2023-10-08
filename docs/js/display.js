/* [Theme toggler]
    + example: https://www.w3schools.com/css/tryit.asp?filename=trycss3_var_js 
    + color picker: https://colorschemedesigner.com/csd-3.5/ 
*/

let theme = "light";

// functions
function getRootStyle(property) {
    const root = document.querySelector(':root');
    const rootStyle = getComputedStyle(root);
    return rootStyle.getPropertyValue(property);
}

function setRootStyle(property, value) {
    const root = document.querySelector(':root');
    root.style.setProperty(property, value);
}

function setLightTheme() {
    setRootStyle(
        "--bg-color", 
        "--light-bg-color"
    );
    setRootStyle(
        "--container-dark-bg-color", 
        "var(--light-container-dark-bg-color)"
    );
    setRootStyle(
        "--container-soft-dark-color", 
        "var(--light-container-soft-dark-color)"
    );
    setRootStyle(
        "--container-light-bg-color", 
        "var(--light-container-light-bg-color)"
    );
    setRootStyle(
        "--text-color", 
        "var(--light-text-color)"
    );
    setRootStyle(
        "--title-color", 
        "var(--light-title-color)"
    );

    theme = "light";
}

function setDarkTheme() {
    setRootStyle(
        "--bg-color", 
        "var(--dark-bg-color)"
    );
    setRootStyle(
        "--container-dark-bg-color", 
        "var(--dark-container-dark-bg-color)"
    );
    setRootStyle(
        "--container-soft-dark-color", 
        "var(--dark-container-soft-dark-color)"
    );
    setRootStyle(
        "--container-light-bg-color", 
        "var(--dark-container-light-bg-color)"
    );
    setRootStyle(
        "--text-color", 
        "var(--dark-text-color)"
    );
    setRootStyle(
        "--title-color", 
        "var(--dark-title-color)"
    );

    theme = "dark";
}

function toggleTheme() {
    if(theme == "light") {
        setDarkTheme();
    } else if(theme == "dark") {
        setLightTheme();
    } else {
        console.log(`error: theme (${theme}) not supported.`);
    }
}

// set theme on load
function pageInit() {
    setLightTheme();
}

$(document).ready(pageInit());