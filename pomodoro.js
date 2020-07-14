
/*
---------------
Querystring options supported:
theme=dark  : forces dark theme (automatically set if detected at OS/webbrowser level)
t=xx        : sets the pomodoro timer to xx minutes (default 25)
b=yy        : sets the break timer to yy minutes (default: 5)
---------------
 */

(function(window){

    function buzzer() {
        let alarm = new Howl({
            src: [alarmPreferences.getSound()],
            volume: 0.75
        });
        alarm.play();

        if (!Notification)
            return;

        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        } else {
            let notification = new Notification("Pomodoro",
            {
                icon: "https://pomodoro.kartones.net/favicon_timesup.png",
                body: currentFocus.get() ? currentFocus.get() : "Time's Up!",
            });
            setTimeout(notification.close.bind(notification), 6000);
            notification.onclick = function () {
                window.focus();
            };
        }
    }

    class CurrentFocus {
        constructor() {
            if (this.isEnabled()) {
                this.reset();
            } else {
                this.hide();
            }
        }

        reset() {
            this.set("");
            document.getElementById("focus").value = "";
        }

        get() {
            return localStorage.getItem("currentFocus");
        }

        set(focus) {
            localStorage.setItem("currentFocus", focus);

            if (!isDarkModeEnabled()) {
                if (focus) {
                    let chosenColor = 0;
                    for (let index = 0, size = focus.length - 1; index < size; index++) {
                        chosenColor += focus.charCodeAt(index) * 10^index;
                    }
                    document.body.style.backgroundColor = colors[chosenColor % colors.length];
                } else {
                    document.body.style.backgroundColor = "#fff";
                }
            }
        }

        isEnabled() {
            return localStorage.getItem("focusEnabled") !== "false";
        }

        hide() {
            document.getElementById("focusContainer").style.visibility = "hidden";
        }

        show() {
            document.getElementById("focusContainer").style.visibility = "visible";
        }

        toggleOnOff() {
            const currentValue = this.isEnabled();
            localStorage.setItem("focusEnabled", !currentValue);

            if (currentValue) {
                this.reset();
                this.hide();
            } else {
                this.show();
            }
        }
    }

    class AlarmPreferences {
        constructor() {
            this.defaultAlarm = "alarm-watch.mp3";
        }

        setSound(soundName) {
            localStorage.setItem("alarm-sound", soundName);
        }

        getSound() {
            const currentAlarm = localStorage.getItem("alarm-sound");
            return currentAlarm !== null ? currentAlarm : this.defaultAlarm;
        }
    }

    /* Based on original code by Milov Patel */
    class Timer {
        constructor(seconds, $remainingTime, $pomodorosCounter) {
            this.intervalId = null;
            this.status = "stop";
            this.$remainingTime = $remainingTime;
            this.$pomodorosCounter = $pomodorosCounter;
            this.isAPomodoro = true;
            this.setSeconds(seconds);
            this.display();
        }

        countdown() {
            this.remainingSeconds--;
            this.display();
            if (this.remainingSeconds <= 0) {
                this.stop();
                this.alarm();
            }
        }

        start() {
            let _this = this;
            if (this.status == "start")
                return;
            this.status = "start";
            if (this.remainingSeconds <= 1)
                return;
            this.intervalId = setInterval(function () { _this.countdown(); }, 1000);
            changeFavicon("favicon_running");
        }

        stop() {
            this.status = "stop";
            if (this.intervalId == null)
                return;
            clearInterval(this.intervalId);
            changeFavicon("favicon_off");
        }

        setSeconds(seconds) {
            this.remainingSeconds = seconds;
        }

        setAndStart(seconds, isAPomodoro) {
            this.stop();
            this.setSeconds(seconds);
            this.isAPomodoro = isAPomodoro;
            this.display();
            this.start();
        }

        display() {
            this.updateDisplay(this.formatTime(this.remainingSeconds));
        }

        formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            return (minutes < 100 ? ("0" + minutes).slice(-2) : minutes)
                + ":" + ("0" + (seconds - (minutes * 60))).slice(-2);
        }

        updateDisplay(format_time) {
            this.$remainingTime.innerHTML = format_time;
        }

        alarm() {
            changeFavicon("favicon_timesup");
            buzzer();
            if (this.isAPomodoro) {
                this.$pomodorosCounter.innerHTML = parseInt(this.$pomodorosCounter.innerHTML, 10) + 1;
            }
            currentFocus.reset();
        }
    }

    function changeFavicon(iconname) {
        /*
        let link = document.createElement("link");
        link.id = "favicon";
        link.rel = "shortcut icon";
        link.href = "https://pomodoro.kartones.net/" + iconname + ".png";
        document.head.removeChild(document.getElementById("favicon"));
        document.head.appendChild(link);
        */
        // testing replacement instead of re-creation, if works across browsers, delete commented code
        document.getElementById("favicon").href = "https://pomodoro.kartones.net/" + iconname + ".png";
    }

    function setDarkMode() {
        document.getElementById("body").className = "dark";
        document.getElementById("focus").className = "dark";
    }

    function isDarkModeEnabled() {
        return window.matchMedia("(prefers-color-scheme:dark)").matches
               || document.getElementById("body").className === "dark";
    }

    function setOptions() {
        const qsParameters = location.search.slice(1).split("&");
        for (const param of qsParameters) {
            parameterFragments = param.split("=");
            switch(parameterFragments[0]) {
                case "t":
                    pomodoroTime = parseInt(decodeURIComponent(parameterFragments[1]), 10) * 60;
                    break;
                case "b":
                    breakTime = parseInt(decodeURIComponent(parameterFragments[1]), 10) * 60;
                    break;
                case "theme":
                    if (parameterFragments[1] === "dark") {
                        setDarkMode();
                    }
                    break;
            }
        };
    }

    window.colors = [
        "#FFC8C8", "#F4CAD6", "#FFA8FF", "#EFCDF8", "#C6C6FF", "#C0E7F3", "#DCEDEA", "#FFEAEA", "#F8DAE2", "#FFC4FF",
        "#EFCDF8", "#DBDBFF", "#D8F0F8", "#E7F3F1", "#FFEAEA", "#FAE7EC", "#FFE3FF", "#F8E9FC", "#EEEEFF", "#EFF9FC",
        "#F2F9F8", "#FFFDFD", "#FEFAFB", "#FFFDFF", "#FFFFFF", "#FDFDFF", "#FAFDFE", "#F7FBFA", "#EEEECE", "#EFE7CF",
        "#EEDCC8", "#F0DCD5", "#EACDC1", "#F0DDD5", "#ECD9D9", "#F1F1D6", "#F5EFE0", "#F2E4D5", "#F5E7E2", "#F0DDD5",
        "#F5E8E2", "#F3E7E7", "#F5F5E2", "#F9F5EC", "#F9F3EC", "#F9EFEC", "#F5E8E2", "#FAF2EF", "#F8F1F1", "#FDFDF9",
        "#FDFCF9", "#FCF9F5", "#FDFAF9", "#FDFAF9", "#FCF7F5", "#FDFBFB", "#F7F7CE", "#FFF7B7", "#FFF1C6", "#FFEAB7",
        "#FFEAC4", "#FFE1C6", "#FFE2C8", "#F9F9DD", "#FFF9CE", "#FFF5D7", "#FFF2D2", "#FFF2D9", "#FFEBD9", "#FFE6D0",
        "#FBFBE8", "#FFFBDF", "#FFFAEA", "#FFF9EA", "#FFF7E6", "#FFF4EA", "#FFF1E6", "#FEFEFA", "#FFFEF7", "#FFFDF7",
        "#FFFDF9", "#FFFDF9", "#FFFEFD", "#FFF9F4", "#D6F8DE", "#DBEADC", "#DDFED1", "#B3FF99", "#DFFFCA", "#FFFFC8",
        "#F7F9D0", "#E3FBE9", "#E9F1EA", "#EAFEE2", "#D2FFC4", "#E8FFD9", "#FFFFD7", "#FAFBDF", "#E3FBE9", "#F3F8F4",
        "#F1FEED", "#E7FFDF", "#F2FFEA", "#FFFFE3", "#FCFCE9", "#FAFEFB", "#FBFDFB", "#FDFFFD", "#F5FFF2", "#FAFFF7",
        "#FFFFFD", "#FDFDF0", "#CACAFF", "#D0E6FF", "#D9F3FF", "#C0F7FE", "#CEFFFD", "#BEFEEB", "#CAFFD8", "#E1E1FF",
        "#DBEBFF", "#ECFAFF", "#C0F7FE", "#E1FFFE", "#BDFFEA", "#EAFFEF", "#EEEEFF", "#ECF4FF", "#F9FDFF", "#E6FCFF",
        "#F2FFFE", "#CFFEF0", "#EAFFEF", "#F9F9FF", "#F9FCFF", "#FDFEFF", "#F9FEFF", "#FDFFFF", "#F7FFFD", "#F9FFFB",
        "#FFCEFF", "#F0C4F0", "#E8C6FF", "#E1CAF9", "#D7D1F8", "#CEDEF4", "#B8E2EF", "#FFDFFF", "#F4D2F4", "#EFD7FF",
        "#EDDFFB", "#E3E0FA", "#E0EAF8", "#C9EAF3", "#FFECFF", "#F4D2F4", "#F9EEFF", "#F5EEFD", "#EFEDFC", "#EAF1FB",
        "#DBF0F7", "#FFF9FF", "#FDF9FD", "#FEFDFF", "#FEFDFF", "#F7F5FE", "#F8FBFE", "#EAF7FB", "#FFCECE", "#FFC8F2",
        "#FFC8E3", "#FFCAF9", "#F5CAFF", "#F0CBFE", "#DDCEFF", "#FFDFDF", "#FFDFF8", "#FFDFEF", "#FFDBFB", "#F9D9FF",
        "#F4DCFE", "#E6DBFF", "#FFECEC", "#FFEEFB", "#FFECF5", "#FFEEFD", "#FDF2FF", "#FAECFF", "#F1ECFF", "#FFF2F2",
        "#FFFEFB", "#FFF9FC", "#FFF9FE", "#FFFDFF", "#FDF9FF", "#FBF9FF"
    ];

    window.breakTime = 5 * 60;
    window.pomodoroTime = 25 * 60;
    // Run before instantiating objects
    setOptions();

    window.alarmPreferences = new AlarmPreferences();
    window.currentFocus = new CurrentFocus();
    window.timer = new Timer(pomodoroTime,
                        document.getElementById("timer_default"),
                        document.getElementById("pomodorosCounter"));

    document.addEventListener("DOMContentLoaded", function () {
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    });
    document.getElementById("pomodoro").onclick = function () {
        window.timer.setAndStart(pomodoroTime, true);
    };
    document.getElementById("break").onclick = function () {
        window.timer.setAndStart(breakTime, false);
    };
    document.getElementById("enableDekstopAlert").onclick = function () {
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    };
    document.getElementById("toggleFocus").onclick = function() {
        window.currentFocus.toggleOnOff();
    }
    document.getElementById("focus").onkeyup = function() {
        window.currentFocus.set(this.value);
    }

    Array.from(document.getElementsByClassName("js-setAlarm")).forEach(function(element) {
        element.onclick = function (element) {
            window.alarmPreferences.setSound(element.target.getAttribute("data-alarm"));
        };
    });


})(this);