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
    console.log(`Calling add(${colour}, ${element}, ${value})`); // Debug log
    if (colour === "red") {
        if (element === "power_block_auto") {
            power_block_auto_red += value;
            power_block_red += value; // Add to the main total for scoring
        } else if (element === "power_block_drive") {
            power_block_drive_red += value;
            power_block_red += value; // Add to the main total for scoring
        } else if (element === "plasma_block") {
            plasma_block_red += value;
        }
    } else if (colour === "blue") {
        if (element === "power_block_auto") {
            power_block_auto_blue += value;
            power_block_blue += value; // Add to the main total for scoring
        } else if (element === "power_block_drive") {
            power_block_drive_blue += value;
            power_block_blue += value; // Add to the main total for scoring
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
    console.log(`Calling switchstate(${color}, ${feature})`); // Debug log
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
            key_blue = !key_blue;
            crossElementId = "key_cross_blue";
        }
    }

    const crossElement = document.getElementById(crossElementId);
    if (crossElement) {
        const isFeatureActive = (color === "red" && ((feature === "park" && park_red) || (feature === "key" && key_red))) ||
                               (color === "blue" && ((feature === "park" && park_blue) || (feature === "key" && key_blue)));
        crossElement.classList.toggle("hidden", isFeatureActive);
    } else {
        console.warn(`Element with ID '${crossElementId}' not found for switchstate.`); // Debug warning
    }
    updateDisplay(); // Update display after switching state
}

/**
 * Function to add penalty points.
 * @param {string} color - The color ("red" or "blue").
 * @param {number} value - The value to multiply by 5 and add as penalty.
 */
function addpenalty(color, value) {
    console.log(`Calling addpenalty(${color}, ${value})`); // Debug log
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
    console.log(`Calling SetTime(${seconds})`); // Debug log
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
                    audioLoadMark.play().catch(e => console.error("Error playing load_mark audio:", e));
                } else if (timeLeft === 60) {
                    audioEndgameStart.play().catch(e => console.error("Error playing endgame_start audio:", e));
                }
            }
        } else {
            clearInterval(timerInterval);
            console.log("Timer finished!");
            if (autoPhaseStarted) {
                audioAutoEnd.play().catch(e => console.error("Error playing auto_end audio:", e));
            } else if (drivePhaseStarted) {
                audioMatchEnd.play().catch(e => console.error("Error playing match_end audio:", e));
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
    } else {
        console.warn("Element with ID 'timer_display' not found."); // Debug warning
    }
}

/**
 * Initiates the Autonomous phase.
 */
function RunAuto() {
    console.log("Calling RunAuto()"); // Debug log
    if (!autoPhaseStarted) {
        SetTime(30); // Call SetTime(30) only once
        audioMatchStart.play().catch(e => console.error("Error playing match_start audio:", e)); // Play audio match_start
        autoPhaseStarted = true;
        drivePhaseStarted = false; // Ensure drive phase is reset if auto is run again
    }
    const autoIcon = document.getElementById("auto_icon");
    const driveIcon = document.getElementById("drive_icon");
    if (autoIcon) autoIcon.classList.remove("hidden"); else console.warn("Element with ID 'auto_icon' not found.");
    if (driveIcon) driveIcon.classList.add("hidden"); else console.warn("Element with ID 'drive_icon' not found.");
    updateDisplay();
}

/**
 * Initiates the Driver Control phase.
 */
function RunDrive() {
    console.log("Calling RunDrive()"); // Debug log
    if (!drivePhaseStarted) {
        SetTime(180); // Call SetTime(180) only once
        audioDriveStart.play().catch(e => console.error("Error playing drive_start audio:", e)); // Play audio drive_start
        drivePhaseStarted = true;
        autoPhaseStarted = false; // Ensure auto phase is reset if drive is run again

        // Double the value of power_block_red and power_block_blue (the main scoring accumulators)
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
    console.log("Calling abort()"); // Debug log
    clearInterval(timerInterval); // Stop the timer
    SetTime(0); // Set timer display to 0:00
    audioAbortMatch.play().catch(e => console.error("Error playing abort_match audio:", e)); // Play audio abort_match

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
    const parkCrossRed = document.getElementById("park_cross_red");
    const keyCrossRed = document.getElementById("key_cross_red");
    const parkCrossBlue = document.getElementById("park_cross_blue");
    const keyCrossBlue = document.getElementById("key_cross_blue");

    if (parkCrossRed) parkCrossRed.classList.remove("hidden"); else console.warn("Element with ID 'park_cross_red' not found for abort.");
    if (keyCrossRed) keyCrossRed.classList.remove("hidden"); else console.warn("Element with ID 'key_cross_red' not found for abort.");
    if (parkCrossBlue) parkCrossBlue.classList.remove("hidden"); else console.warn("Element with ID 'park_cross_blue' not found for abort.");
    if (keyCrossBlue) keyCrossBlue.classList.remove("hidden"); else console.warn("Element with ID 'key_cross_blue' not found for abort.");

    updateDisplay(); // Update display to reflect reset values
}

/**
 * Sets the match ID string based on the provided match number.
 * @param {number} match - The match number.
 */
function setmatch(match) {
    console.log(`Calling setmatch(${match})`); // Debug log
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
    console.log("Calling updateDisplay()"); // Debug log
    // Update score displays
    // power_block_red and plasma_block_red (and blue counterparts) are visible
    const powerBlockRedDisplay = document.getElementById("power_block_red_display");
    if (powerBlockRedDisplay) {
        powerBlockRedDisplay.textContent = power_block_red;
    } else {
        console.warn("Element with ID 'power_block_red_display' not found.");
    }

    const plasmaBlockRedDisplay = document.getElementById("plasma_block_red_display");
    if (plasmaBlockRedDisplay) {
        plasmaBlockRedDisplay.textContent = plasma_block_red;
    } else {
        console.warn("Element with ID 'plasma_block_red_display' not found.");
    }

    const penaltyRedDisplay = document.getElementById("penalty_red_display");
    if (penaltyRedDisplay) {
        penaltyRedDisplay.textContent = penalty_red;
    } else {
        console.warn("Element with ID 'penalty_red_display' not found.");
    }

    const totalscoreRedDisplay = document.getElementById("totalscore_red_display");
    if (totalscoreRedDisplay) {
        totalscoreRedDisplay.textContent = totalscore_red;
    } else {
        console.warn("Element with ID 'totalscore_red_display' not found.");
    }


    const powerBlockBlueDisplay = document.getElementById("power_block_blue_display");
    if (powerBlockBlueDisplay) {
        powerBlockBlueDisplay.textContent = power_block_blue;
    } else {
        console.warn("Element with ID 'power_block_blue_display' not found.");
    }

    const plasmaBlockBlueDisplay = document.getElementById("plasma_block_blue_display");
    if (plasmaBlockBlueDisplay) {
        plasmaBlockBlueDisplay.textContent = plasma_block_blue;
    } else {
        console.warn("Element with ID 'plasma_block_blue_display' not found.");
    }

    const penaltyBlueDisplay = document.getElementById("penalty_blue_display");
    if (penaltyBlueDisplay) {
        penaltyBlueDisplay.textContent = penalty_blue;
    } else {
        console.warn("Element with ID 'penalty_blue_display' not found.");
    }

    const totalscoreBlueDisplay = document.getElementById("totalscore_blue_display");
    if (totalscoreBlueDisplay) {
        totalscoreBlueDisplay.textContent = totalscore_blue;
    } else {
        console.warn("Element with ID 'totalscore_blue_display' not found.");
    }


    // These specific auto/drive power block displays are NOT visible on chromakey as per user request
    // document.getElementById("power_block_auto_red_display").textContent = power_block_auto_red;
    // document.getElementById("power_block_drive_red_display").textContent = power_block_drive_red;
    // document.getElementById("power_block_auto_blue_display").textContent = power_block_auto_blue;
    // document.getElementById("power_block_drive_blue_display").textContent = power_block_drive_blue;


    // Update match ID display
    const matchIdElement = document.getElementById("match_id_display");
    if (matchIdElement) {
        matchIdElement.textContent = match_id;
    } else {
        console.warn("Element with ID 'match_id_display' not found.");
    }


    // Update visibility of cross icons based on boolean states
    const parkCrossRed = document.getElementById("park_cross_red");
    const keyCrossRed = document.getElementById("key_cross_red");
    const parkCrossBlue = document.getElementById("park_cross_blue");
    const keyCrossBlue = document.getElementById("key_cross_blue");
    const autoIcon = document.getElementById("auto_icon");
    const driveIcon = document.getElementById("drive_icon");

    if (parkCrossRed) parkCrossRed.classList.toggle("hidden", park_red); else console.warn("Element with ID 'park_cross_red' not found.");
    if (keyCrossRed) keyCrossRed.classList.toggle("hidden", key_red); else console.warn("Element with ID 'key_cross_red' not found.");
    if (parkCrossBlue) parkCrossBlue.classList.toggle("hidden", park_blue); else console.warn("Element with ID 'park_cross_blue' not found.");
    if (keyCrossBlue) keyCrossBlue.classList.toggle("hidden", key_blue); else console.warn("Element with ID 'key_cross_blue' not found.");
    if (autoIcon) autoIcon.classList.toggle("hidden", !autoPhaseStarted); else console.warn("Element with ID 'auto_icon' not found."); // Show if auto phase started
    if (driveIcon) driveIcon.classList.toggle("hidden", !drivePhaseStarted); else console.warn("Element with ID 'drive_icon' not found."); // Show if drive phase started

    // Always update the score after any change to ensure real-time reflection
    updatescore("red");
    updatescore("blue");
}

// Initial display update when the script loads
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded and parsed. Initializing display."); // Debug log
    updateDisplay();
    SetTime(0); // Initialize timer to 0:00
});