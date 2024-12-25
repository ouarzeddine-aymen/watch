import logo from './logo.svg';
import './App.css';
import './VideoPlayer.css';
import VideoPlayer from './VideoPlayer';
import tracks from './tracks.vtt';

function App() {
  return (
    <div className="App">
      <VideoPlayer />
      <h5>Hls Video Player created by Matthaios Zafeiriou 16/06/2024</h5>
    </div>
  );
}

export default App;
