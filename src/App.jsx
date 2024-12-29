import { useRef } from "react";
import DisplaySection from "./components/DisplaySection";
import Jambotron from "./components/Jambotron";
import Nav from "./components/Nav";
import SoundSection from "./components/SoundSection";
import WebViewer from "./components/WebViewer";
import Loader from "./components/Loader";




function App() {
  const webgiViewerRef = useRef()
  const contentRef = useRef()

  const handlePreview = () => {
    webgiViewerRef.current.triggerPreview()

  }
  return (
    <div className="App">
      <Loader />
      <div ref={contentRef} id="content">
        <Nav />
        <Jambotron />
        <SoundSection />
        <DisplaySection triggerPreview={handlePreview} />

      </div>

      <WebViewer contentRef={contentRef} ref={webgiViewerRef} />
    </div>
  );
}

export default App;
