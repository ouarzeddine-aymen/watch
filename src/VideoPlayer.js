import React from 'react';
import Hls from "hls.js";
import { isMobile } from 'react-device-detect';
import tracks from './tracks.vtt';

class VideoPlayer extends React.Component {

    constructor(props) {
        super(props);
        this.cooldown = null;
        this.mouseInside = false;

        this.state = {
            video_url: "https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
            lastVolume: 0,
            bannerImg: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/SMPTE_Color_Bars.svg/1200px-SMPTE_Color_Bars.svg.png",
            tracks: tracks,
        }
        this.keyPressed = this.keyPressed.bind(this);
        this.cooldownToHide = this.cooldownToHide.bind(this);
        this.togglePlay = this.togglePlay.bind(this);
    }

    toHHMMSS(secs) {
        var sec_num = parseInt(secs, 10)
        var hours = Math.floor(sec_num / 3600)
        var minutes = Math.floor(sec_num / 60) % 60
        var seconds = sec_num % 60

        return [hours, minutes, seconds]
            .map(v => v < 10 ? "0" + v : v)
            .filter((v, i) => v !== "00" || i > 0)
            .join(":")
    }

    cooldownToHide() {
        const player = document.getElementById('player');

        document.getElementsByClassName("video-player")[0].style.cursor = null;
        const controls = document.getElementsByClassName('controls')[0];
        if (!isMobile)
            controls.classList.remove('hide');
        if (this.cooldown != null)
            clearTimeout(this.cooldown);
        this.cooldown = setTimeout(() => {
            if (player.paused)
                return;
            const controls = document.getElementsByClassName('controls')[0];
            if (this.state.mouseInside)
                return;
            controls.classList.add('hide');
            if (isMobile) {
                document.getElementsByClassName("play-button")[0].classList.add("hidebutton");
            }

            document.getElementsByClassName("video-player")[0].style.cursor = "none";
        }, 1000);
    }

    keyPressed(e) {
        const inputElement = document.getElementById('searchingtop');
        if (document.activeElement === inputElement)
            return;

        if (e.keyCode === 32) { // key space
            const player = document.getElementById('player');
            if (player.paused) {
                player.play();
                this.setPause();
                document.getElementsByClassName("play-button")[0].classList.add("hidebutton");
                this.cooldownToHide();
            } else {
                player.pause();
                this.setPlay();
                const controls = document.getElementsByClassName('controls')[0];
                document.getElementsByClassName("play-button")[0].classList.remove("hidebutton");
                controls.classList.remove('hide');
            }
            e.preventDefault();
        }
        if (e.keyCode === 70) { // key F
            const player = document.getElementsByClassName('video-player')[0];
            // toggle fullscreen
            if (document.fullscreenElement) {
                document.exitFullscreen();
                this.setFullscreen();
            } else {
                player.requestFullscreen();
                this.setExitFullscreen();
            }
            e.preventDefault();
        }
        if (e.keyCode === 77) { // key M
            this.toggleMute();
        }
        if (e.keyCode === 37) { // key left
            const player = document.getElementById('player');
            document.getElementsByClassName("backward-div")[0].style.animation = "";
            document.getElementsByClassName("backward-div")[0].style.animation = "forward .5s";

            player.currentTime -= 5;
        }
        if (e.keyCode === 39) { // key right
            const player = document.getElementById('player');
            document.getElementsByClassName("forward-div")[0].style.animation = "";
            document.getElementsByClassName("forward-div")[0].style.animation = "forward .5s";

            player.currentTime += 5;
        }
    }
    setPlay() {
        const button = document.getElementById("play");
        button.innerHTML = "<i class='fa-solid fa-play'></i>";
    }
    setPause() {
        const button = document.getElementById("play");
        button.innerHTML = "<i class='fa-solid fa-pause'></i>";
    }

    componentDidMount() {
        const video = document.getElementById('player');
        const tracks = document.getElementById('captions');
        const hls = new Hls();
        const url = this.state.video_url;

        hls.loadSource(url);
        hls.attachMedia(video);
        this.changeAudio(50);
        video.addEventListener("timeupdate", (event) => {
            document.getElementById("currenttime").innerHTML = this.toHHMMSS(video.currentTime.toFixed(2));
            document.getElementById("progressBar").value = video.currentTime;
            if (video.muted) {
                video.volume = 0;
                video.muted = false;
            }
            this.changeAudio(video.volume * 100);

            if (video.paused && document.getElementById("play").innerHTML === "<i class=\"fa-solid fa-pause\"></i>") {
                this.setPause();
            }
            if (!video.paused && document.getElementById("play").innerHTML === "<i class=\"fa-solid fa-play\"></i>")
                this.setPlay();

            const currentPercentage = (video.currentTime / video.duration) * 100;
            const progressBar = document.getElementById("progressBar");
            progressBar.style.background = `linear-gradient(to right, #f44336 0%, #f44336 ${currentPercentage}%, #fff ${currentPercentage}%, white 100%)`;
        });

        if (isMobile) {
            document.addEventListener("visibilitychange", (e) => {
                if (document.visibilityState === 'hidden') {
                    video.pause();
                    this.setPause();
                }
            });
        }

        video.addEventListener("loadeddata", (event) => {
            document.getElementById("progressBar").max = video.duration;
            document.getElementById("duration").innerHTML = this.toHHMMSS(video.duration.toFixed(2));
            document.getElementById("currenttime").innerHTML = this.toHHMMSS(video.currentTime.toFixed(2));
            document.getElementById("progressBar").value = video.currentTime;
        })
        document.addEventListener('keydown', this.keyPressed);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.loadSource();
            hls.attachMedia(video)
        });
    }

    toggleMute() {
        const player = document.getElementById('player');
        if (this.state.lastVolume === 0) {
            this.state.lastVolume = player.volume;
            player.volume = 0;
            document.getElementById("audioBar").value = 0;
            document.getElementById("audioIcon").innerHTML = "<i class='fa-solid fa-volume-mute'></i>";
        } else {
            player.volume = this.state.lastVolume;
            document.getElementById("audioBar").value = this.state.lastVolume * 100;
            if (this.state.lastVolume * 100 < 50)
                document.getElementById("audioIcon").innerHTML = "<i class='fa-solid fa-volume-low'></i>";
            else
                document.getElementById("audioIcon").innerHTML = "<i class='fa-solid fa-volume-high'></i>";
            this.state.lastVolume = 0;
        }
        const currentPercentage = player.volume * 100;
        const audioBar = document.getElementById("audioBar");
        audioBar.style.background = `linear-gradient(to right, #f44336 0%, #f44336 ${currentPercentage}%, #fff ${currentPercentage}%, white 100%)`;
    }

    setFullscreen() {
        const button = document.getElementById("fullscreen");
        button.innerHTML = "<i class='fa-solid fa-expand'></i>";
    }
    setExitFullscreen() {
        const button = document.getElementById("fullscreen");
        button.innerHTML = "<i class='fa-solid fa-compress'></i>";
    }

    togglePlay() {
        if (isMobile) {
            document.getElementsByClassName("play-button")[0].firstChild.firstChild.classList.add("fa-play");
            document.getElementsByClassName("play-button")[0].firstChild.firstChild.classList.remove("fa-pause");
        }
        const player = document.getElementById('player');
        if (player.paused) {
            player.play();
            this.setPause();
            document.getElementsByClassName("play-button")[0].classList.add("hidebutton");
        } else {
            player.pause();
            this.setPlay();
            document.getElementsByClassName("play-button")[0].classList.remove("hidebutton");
        }
    }

    changeAudio(value) {
        const player = document.getElementById('player');
        player.volume = value / 100;
        if (value === 0)
            document.getElementById("audioIcon").innerHTML = "<i class='fa-solid fa-volume-mute'></i>";
        else if (value < 50)
            document.getElementById("audioIcon").innerHTML = "<i class='fa-solid fa-volume-low'></i>";
        else
            document.getElementById("audioIcon").innerHTML = "<i class='fa-solid fa-volume-high'></i>";


        const currentPercentage = value;
        const audioBar = document.getElementById("audioBar");
        audioBar.value = value;
        audioBar.style.background = `linear-gradient(to right, #f44336 0%, #f44336 ${currentPercentage}%, #fff ${currentPercentage}%, white 100%)`;
    }

    render() {
        return (
            <>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"></link>
                <div className="video-player" onMouseEnter={() => {
                    const player = document.getElementsByClassName('video-player')[0];
                    if (!player.paused) {
                        const controls = document.getElementsByClassName('controls')[0];
                        controls.classList.remove('hide');
                    }
                }}
                    onMouseMove={() => {
                        this.cooldownToHide();
                    }}>
                    <div className='play-button'>
                        <h5><i className="fa-solid fa-play"></i></h5>
                    </div>
                    <div className="forward-div">
                        <div className="forward-icon">5s <i className="fa-solid fa-forward fa-beat-fade"></i>
                        </div>
                    </div>
                    <div className="backward-div">
                        <div className="backward-icon"><i className="fa-solid fa-backward fa-beat-fade"></i> 5s
                        </div>
                    </div>

                    <div className='controls' onMouseEnter={() => {
                        if (isMobile)
                            return;
                        const controls = document.getElementsByClassName('controls')[0];
                        controls.classList.remove('hide');
                        this.state.mouseInside = true;
                    }} onMouseLeave={() => {
                        this.state.mouseInside = false;
                        this.cooldownToHide();
                    }} onMouseMove={() => {
                        if (isMobile)
                            return;
                        const controls = document.getElementsByClassName('controls')[0];
                        controls.classList.remove('hide');
                        this.state.mouseInside = true;
                    }} onTouchEndCapture={() => {
                        this.state.mouseInside = false;
                        this.cooldownToHide();
                    }}>
                        <button id="play" onClick={() => {
                            this.togglePlay();
                        }}><i className="fa-solid fa-play"></i></button>
                        <h5 id="currenttime">00:00</h5>
                        <div className='progress-bar'>
                            <input type="range" id="progressBar" name="progressBar" defaultValue="0" min="0" max="100" onChange={
                                () => {
                                    this.state.mouseInside = true;
                                    const player = document.getElementById('player');
                                    player.currentTime = document.getElementById("progressBar").value;
                                    document.getElementById("currenttime").innerHTML = this.toHHMMSS(player.currentTime.toFixed(2));

                                    const currentPercentage = (player.currentTime / player.duration) * 100;
                                    const progressBar = document.getElementById("progressBar");
                                    progressBar.style.background = `linear-gradient(to right, var(--bar) 0%, var(--bar) ${currentPercentage}%, #fff ${currentPercentage}%, white 100%)`;
                                }
                            } onTouchEndCapture={() => {
                                this.state.mouseInside = false;
                                this.cooldownToHide();
                            }}></input>
                        </div>

                        <h5 id="duration">00:00:00</h5>
                        <button id="audioIcon" onClick={() => {
                            this.toggleMute();

                        }}><i className="fa-solid fa-volume-high"></i></button>
                        <div className='audio-bar'>
                            <input type="range" id="audioBar" name="audioBar" defaultValue="0" min="0" max="100" onChange={() => {
                                const value = document.getElementById("audioBar").value;
                                this.changeAudio(value);
                            }}></input>
                        </div>
                        <button id="captionsIcon" onClick={() => {
                            const captions = document.getElementById('captions');
                            if (captions.track.mode === "showing") {
                                captions.track.mode = "hidden";
                                document.getElementById("captionsIcon").innerHTML = "<i class='fa-regular fa-closed-captioning'></i>";
                            } else {
                                captions.track.mode = "showing";
                                document.getElementById("captionsIcon").innerHTML = "<i class='fa-solid fa-closed-captioning'></i>";
                            }
                        }}><i className="fa-solid fa-closed-captioning"></i></button>

                        <button id="fullscreen" onClick={() => {
                            const player = document.getElementsByClassName('video-player')[0];
                            // toggle fullscreen
                            if (document.fullscreenElement) {
                                document.exitFullscreen();
                                this.setFullscreen();
                            } else {
                                player.requestFullscreen();
                                this.setExitFullscreen();
                            }

                        }}><i className="fa-solid fa-expand"></i></button>
                    </div>
                    <video controls={false} id="player" poster={this.state.bannerImg} playsInline crossOrigin='anonymous' style={{ width: '100%', height: '100%' }}
                        ref={player => (player = player)}
                        onClick={() => {
                            if (isMobile) {
                                const controls = document.getElementsByClassName('controls')[0];
                                if (controls.classList.contains('hide')) {
                                    controls.classList.remove('hide');
                                    document.getElementsByClassName("play-button")[0].classList.remove("hidebutton");
                                    document.getElementsByClassName("play-button")[0].firstChild.firstChild.classList.remove("fa-play");
                                    document.getElementsByClassName("play-button")[0].firstChild.firstChild.classList.add("fa-pause");
                                } else {
                                    this.cooldownToHide();
                                    this.togglePlay();
                                }
                            } else {
                                this.togglePlay();
                            }
                        }}
                        onDoubleClick={(e) => {
                            const player = document.getElementsByClassName('video-player')[0];
                            if (isMobile) {
                                e.preventDefault();
                                // get position of the click
                                const x = e.clientX - e.target.getBoundingClientRect().left;
                                const width = e.target.clientWidth;

                                const percentage = x / width;
                                if (percentage < 0.5) {
                                    document.getElementsByClassName("backward-div")[0].style.animation = "none";
                                    document.getElementsByClassName("backward-div")[0].style.animation = "forward .5s";
                                    document.getElementById('player').currentTime -= 5;
                                } else {
                                    document.getElementsByClassName("forward-div")[0].style.animation = "none";
                                    document.getElementsByClassName("forward-div")[0].style.animation = "forward .5s";
                                    document.getElementById('player').currentTime += 5;
                                }
                            } else {
                                e.preventDefault();
                                // toggle fullscreen
                                if (document.fullscreenElement) {
                                    document.exitFullscreen();
                                    this.setFullscreen();
                                } else {
                                    player.requestFullscreen();
                                    this.setExitFullscreen();
                                }
                            }
                        }}
                    >
                        <source src="" type="video/mp4" />
                        <track id="captions" default kind="captions" srclang="en" src={this.state.tracks} />
                    </video>
                </div>

            </>
        )
    }
}

export default VideoPlayer;