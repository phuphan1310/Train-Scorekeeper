// a). Integer variables for scores
let power_block_red = 0; // Total power blocks for red (used in score calculation)
let power_block_auto_red = 0; // Power blocks scored in autonomous for red
let power_block_drive_red = 0; // Power blocks scored in driver control for red
let plasma_block_red = 0; // Plasma blocks for red

let power_block_blue = 0; // Total power blocks for blue (used in score calculation)
let power_block_auto_blue = 0; // Power blocks scored in autonomous for blue
let power_block_drive_blue = 0; // Power blocks scored in driver control for blue
let plasma_block_blue = 0; // Plasma blocks for blue

// c). Penalty variables
let penalty_red = 0;
let penalty_blue = 0;

// d). Total score variables
let totalscore_red = 0;
let totalscore_blue = 0;

// b). Boolean variables for state
let park_red = false;
let park_blue = false;
let key_red = false;
let key_blue = false;

// Timer variables
let timerInterval;
let timeLeft = 0;
let autoPhaseStarted = false; // To ensure SetTime(30) is called only once in RunAuto
let drivePhaseStarted = false; // To ensure SetTime(180) is called only once in RunDrive

// i). Match ID variable
let match_id = "Not Set";

// Audio objects (ensure these paths are correct relative to your HTML file)
const audioMatchStart = new Audio('audio/match_start.wav');
const audioAutoEnd = new Audio('audio/auto_end.wav');
const audioDriveStart = new Audio('audio/drive_start.wav');
const audioEndgameStart = new Audio('audio/endgame_start.wav');
const audioLoadMark = new Audio('audio/load_mark.mp3');
const audioMatchEnd = new Audio('audio/match_end.wav');
const audioAbortMatch = new Audio('audio/abort_match.wav');

/**
 * Function to add value to specific score elements.
 * @param {string} colour - The color ("red" or "blue").
 * @param {string} element - The element type ("power_block_auto", "power_block_drive", or "plasma_block").
 * @param {number} value - The value to add.
 */
function add(colour, element, value) {
    if (colour === "red") {
        if (element === "power_block_auto") {
            power_block_auto_red += value;
            power_block_red += value;
        } else if (element === "power_block_drive") {
            power_block_drive_red += value;
            power_block_red += value;
        } else if (element === "plasma_block") {
            plasma_block_red += value;
        }
    } else if (colour === "blue") {
        if (element === "power_block_auto") {
            power_block_auto_blue += value;
            power_block_blue += value;
        } else if (element === "power_block_drive") {
            power_block_drive_blue += value;
            power_block_blue += value;
        } else if (element === "plasma_block") {
            plasma_block_blue += value;
        }
    }
    updateDisplay(); // Update display after changing values
}

/**
 * Function to flip the state of a feature (park or key) and toggle visibility of its cross icon.
 * @param {string} color - The color ("red" or "blue").
 * @param {string} feature - The feature type ("park" or "key").
 */
function switchstate(color, feature) {
    let crossElementId;
    if (color === "red") {
        if (feature === "park") {
            park_red = !park_red;
            crossElementId = "park_cross_red";
        } else if (feature === "key") {
            key_red = !key_red;
            crossElementId = "key_cross_red";
        }
    } else if (color === "blue") {
        if (feature === "park") {
            park_blue = !park_blue;
            crossElementId = "park_cross_blue";
        } else if (feature === "key") {
            // Note: The original prompt had key_red here for blue team, corrected to key_blue
            key_blue = !key_blue;
            crossElementId = "key_cross_blue";
        }
    }

    const crossElement = document.getElementById(crossElementId);
    if (crossElement) {
        // park_cross_red visible means park_red = false, so if park_red is true, cross should be hidden.
        // If park_red is false, cross should be visible. This logic applies to all 'cross' elements.
        const isFeatureActive = (color === "red" && ((feature === "park" && park_red) || (feature === "key" && key_red))) ||
                               (color === "blue" && ((feature === "park" && park_blue) || (feature === "key" && key_blue)));
        crossElement.classList.toggle("hidden", isFeatureActive);
    }
    updateDisplay(); // Update display after switching state
}

/**
 * Function to add penalty points.
 * @param {string} color - The color ("red" or "blue").
 * @param {number} value - The value to multiply by 5 and add as penalty.
 */
function addpenalty(color, value) {
    if (color === "red") {
        penalty_red += 5 * value;
    } else if (color === "blue") {
        penalty_blue += 5 * value;
    }
    updateDisplay(); // Update display after adding penalty
}

/**
 * Function to update the total score for a given color.
 * @param {string} color - The color ("red" or "blue").
 */
function updatescore(color) {
    if (color === "red") {
        let baseScore = (5 * power_block_auto_red) + (5 * power_block_drive_red) + (15 * plasma_block_red) + (20 * (park_red ? 1 : 0)) + penalty_red;
        if (key_red) {
            totalscore_red = Math.round(baseScore * 1.1);
        } else {
            totalscore_red = baseScore;
        }
    } else if (color === "blue") {
        let baseScore = (5 * power_block_auto_blue) + (5 * power_block_drive_blue) + (15 * plasma_block_blue) + (20 * (park_blue ? 1 : 0)) + penalty_blue;
        if (key_blue) {
            totalscore_blue = Math.round(baseScore * 1.1);
        } else {
            totalscore_blue = baseScore;
        }
    }
    // No updateDisplay() here, as it's called by other functions
    // that modify the underlying data, preventing infinite loops.
}

/**
 * Sets the timer to a specified number of seconds and starts the countdown.
 * @param {number} seconds - The number of seconds to set the timer.
 */
function SetTime(seconds) {
    clearInterval(timerInterval); // Clear any existing interval
    timeLeft = seconds;
    updateTimerDisplay(); // Initial display

    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimerDisplay();

            // Play load_mark audio at specific times during drive phase
            if (drivePhaseStarted) {
                if (timeLeft === 150 || timeLeft === 105 || timeLeft === 45) {
                    audioLoadMark.play();
                } else if (timeLeft === 60) {
                    audioEndgameStart.play();
                }
            }
        } else {
            clearInterval(timerInterval);
            console.log("Timer finished!");
            if (autoPhaseStarted) {
                audioAutoEnd.play();
            } else if (drivePhaseStarted) {
                audioMatchEnd.play();
            }
        }
    }, 1000);
}

/**
 * Updates the timer display in M:SS format.
 */
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    const timerElement = document.getElementById("timer_display");
    if (timerElement) {
        timerElement.textContent = formattedTime;
    }
}

/**
 * Initiates the Autonomous phase.
 */
function RunAuto() {
    if (!autoPhaseStarted) {
        SetTime(30); // Call SetTime(30) only once
        audioMatchStart.play(); // Play audio match_start
        autoPhaseStarted = true;
        drivePhaseStarted = false; // Ensure drive phase is reset if auto is run again
    }
    const autoIcon = document.getElementById("auto_icon");
    const driveIcon = document.getElementById("drive_icon");
    if (autoIcon) autoIcon.classList.remove("hidden");
    if (driveIcon) driveIcon.classList.add("hidden");
    updateDisplay();
}

/**
 * Initiates the Driver Control phase.
 */
function RunDrive() {
    if (!drivePhaseStarted) {
        SetTime(180); // Call SetTime(180) only once
        audioDriveStart.play(); // Play audio drive_start
        drivePhaseStarted = true;
        autoPhaseStarted = false; // Ensure auto phase is reset if drive is run again

        // Double the value of power_block_red and power_block_blue
        power_block_red *= 2;
        power_block_blue *= 2;

        // Add power_block_auto_red to power_block_drive_red
        power_block_drive_red += power_block_auto_red;
        power_block_drive_blue += power_block_auto_blue;
    }
    const autoIcon = document.getElementById("auto_icon");
    const driveIcon = document.getElementById("drive_icon");
    if (autoIcon) autoIcon.classList.add("hidden");
    if (driveIcon) driveIcon.classList.remove("hidden");
    updateDisplay();
}

/**
 * Aborts the match, resets variables, and hides icons.
 */
function abort() {
    clearInterval(timerInterval); // Stop the timer
    SetTime(0); // Set timer display to 0:00
    audioAbortMatch.play(); // Play audio abort_match

    // Reset all score variables to 0
    power_block_red = 0;
    power_block_auto_red = 0;
    power_block_drive_red = 0;
    plasma_block_red = 0;

    power_block_blue = 0;
    power_block_auto_blue = 0;
    power_block_drive_blue = 0;
    plasma_block_blue = 0;

    penalty_red = 0;
    penalty_blue = 0;
    totalscore_red = 0;
    totalscore_blue = 0;

    // Reset boolean variables to false
    park_red = false;
    park_blue = false;
    key_red = false;
    key_blue = false;

    // Reset phase flags
    autoPhaseStarted = false;
    drivePhaseStarted = false;

    // Hide auto and drive icons
    const autoIcon = document.getElementById("auto_icon");
    const driveIcon = document.getElementById("drive_icon");
    if (autoIcon) autoIcon.classList.add("hidden");
    if (driveIcon) driveIcon.classList.add("hidden");

    // Ensure all cross icons are visible (initial state)
    document.getElementById("park_cross_red").classList.remove("hidden");
    document.getElementById("key_cross_red").classList.remove("hidden");
    document.getElementById("park_cross_blue").classList.remove("hidden");
    document.getElementById("key_cross_blue").classList.remove("hidden");

    updateDisplay(); // Update display to reflect reset values
}

/**
 * Sets the match ID string based on the provided match number.
 * @param {number} match - The match number.
 */
function setmatch(match) {
    switch (match) {
        case 1:
            match_id = "Upper Bracket - Round 1 - Match 1";
            break;
        case 2:
            match_id = "Upper Bracket - Round 1 - Match 2";
            break;
        case 3:
            match_id = "Upper Bracket - Round 1 - Match 3";
            break;
        case 4:
            match_id = "Upper Bracket - Round 1 - Match 4";
            break;
        case 5:
            match_id = "Lower Bracket - Round 2 - Match 5";
            break;
        case 6:
            match_id = "Lower Bracket - Round 2 - Match 6";
            break;
        case 7:
            match_id = "Upper Bracket - Round 2 - Match 7";
            break;
        case 8:
            match_id = "Upper Bracket - Round 2 - Match 8";
            break;
        case 9:
            match_id = "Lower Bracket - Round 3 - Match 9";
            break;
        case 10:
            match_id = "Lower Bracket - Round 3 - Match 10";
            break;
        case 11:
            match_id = "Upper Bracket - Round 4 - Match 11";
            break;
        case 12:
            match_id = "Lower Bracket - Round 4 - Match 12";
            break;
        case 13:
            match_id = "Lower Bracket - Round 5 - Match 13";
            break;
        case 14:
            match_id = "Finals Bracket - Round 6 - Match 14";
            break;
        case 15:
            match_id = "Finals Bracket - Round 6 - Match 15";
            break;
        default:
            match_id = "Unknown Match";
            break;
    }
    updateDisplay(); // Update display after setting match ID
}

/**
 * Updates all displayed values and states on the HTML page.
 */
function updateDisplay() {
    // Update score displays
    document.getElementById("power_block_red_display").textContent = power_block_red;
    document.getElementById("power_block_auto_red_display").textContent = power_block_auto_red;
    document.getElementById("power_block_drive_red_display").textContent = power_block_drive_red;
    document.getElementById("plasma_block_red_display").textContent = plasma_block_red;
    document.getElementById("penalty_red_display").textContent = penalty_red;
    document.getElementById("totalscore_red_display").textContent = totalscore_red;

    document.getElementById("power_block_blue_display").textContent = power_block_blue;
    document.getElementById("power_block_auto_blue_display").textContent = power_block_auto_blue;
    document.getElementById("power_block_drive_blue_display").textContent = power_block_drive_blue;
    document.getElementById("plasma_block_blue_display").textContent = plasma_block_blue;
    document.getElementById("penalty_blue_display").textContent = penalty_blue;
    document.getElementById("totalscore_blue_display").textContent = totalscore_blue;

    // Update match ID display
    document.getElementById("match_id_display").textContent = match_id;

    // Update visibility of cross icons based on boolean states
    // 'hidden' class means the element is not visible.
    // If the state (e.g., park_red) is TRUE, it means the feature is active, so the 'cross' should be hidden.
    // If the state is FALSE, it means the feature is NOT active, so the 'cross' should be visible.
    // Ensure these elements exist in your HTML with these IDs.
    const parkCrossRed = document.getElementById("park_cross_red");
    const keyCrossRed = document.getElementById("key_cross_red");
    const parkCrossBlue = document.getElementById("park_cross_blue");
    const keyCrossBlue = document.getElementById("key_cross_blue");
    const timerDisplay = document.getElementById("timer_display");
    const autoIcon = document.getElementById("auto_icon");
    const driveIcon = document.getElementById("drive_icon");

    if (parkCrossRed) parkCrossRed.classList.toggle("hidden", park_red);
    if (keyCrossRed) keyCrossRed.classList.toggle("hidden", key_red);
    if (parkCrossBlue) parkCrossBlue.classList.toggle("hidden", park_blue);
    if (keyCrossBlue) keyCrossBlue.classList.toggle("hidden", key_blue);
    if (autoIcon) autoIcon.classList.toggle("hidden", !autoPhaseStarted); // Show if auto phase started
    if (driveIcon) driveIcon.classList.toggle("hidden", !drivePhaseStarted); // Show if drive phase started

    // Always update the score after any change to ensure real-time reflection
    updatescore("red");
    updatescore("blue");
}

// Initial display update when the script loads
document.addEventListener("DOMContentLoaded", () => {
    updateDisplay();
    SetTime(0); // Initialize timer to 0:00
});
