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
                let $focusNode = document.getElementById("focus");
                if (focus) {
                    if (focus.length < 23) {
                        $focusNode.style.fontSize = "22px";
                    } else if (focus.length < 24) {
                        $focusNode.style.fontSize = "21px";
                    } else if (focus.length < 26) {
                        $focusNode.style.fontSize = "19px";
                    } else {
                        $focusNode.style.fontSize = "17px";
                    }

                    let chosenColor = 0;
                    for (let index = 0, size = focus.length - 1; index < size; index++) {
                        chosenColor += focus.charCodeAt(index) * 10^index;
                    }
                    $focusNode.style.color = colors[chosenColor % colors.length];
                    $focusNode.style.borderBottomColor = colors[chosenColor % colors.length];
                } else {
                    $focusNode.style.fontSize = "22px";
                    $focusNode.style.color = "#fff";
                    $focusNode.style.borderBottomColor = "#222";
                }
            }
        }

        isEnabled() {
            return localStorage.getItem("focusEnabled") !== "false";
        }

        hide() {
            document.getElementById("focusContainer").className = "hidden"
        }

        show() {
            document.getElementById("focusContainer").className = "focus";
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
        "#3E2A8F", "#8D2965", "#B14623", "#D10000", "#1B844E", "#1D54AC", "#528227"
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