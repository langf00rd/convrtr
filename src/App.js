import { createRef, useEffect, useState } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import Loader from "./Loader";
import "./App.css";

const ffmpeg = createFFmpeg({ log: true });

function App() {
  const fileRef = createRef();
  const [selectedFileExt, setSelectedFileExt] = useState("");
  const [outputFileExt, setOutputFileExt] = useState("");
  const [filename, setFilename] = useState("");
  const [video, setVideo] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const onFileSelect = () => {
    const file = fileRef.current.files[0];
    const _filename = file.name;
    const splitFilename = _filename.split(".");

    setFilename(splitFilename[0]);
    setSelectedFileExt(file.name.split(".").pop());
    setVideo(file);
  };

  const initConvert = async () => {
    try {
      if (!ready) await load();

      setLoading(true);

      const output = `output.${outputFileExt}`;
      const tempFile = `test.${selectedFileExt}`;

      ffmpeg.FS("writeFile", tempFile, await fetchFile(video)); // Write the file to memory
      await ffmpeg.run("-i", tempFile, output); // Run the FFMpeg command
      const data = ffmpeg.FS("readFile", output); // Read the result

      downloadBlob(data);
    } catch (e) {
      setLoading(false);
      console.warn(e);
    }
  };

  const downloadBlob = (blob) => {
    console.warn("blob, name", blob);

    if (window.navigator && window.navigator.msSaveOrOpenBlob)
      return window.navigator.msSaveOrOpenBlob(blob);

    const data = URL.createObjectURL(
      new Blob([blob.buffer], { type: `video/${outputFileExt}` })
    );

    const link = document.createElement("a");
    link.href = data;
    link.download = `${filename}.${outputFileExt}`;

    link.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );

    setTimeout(() => {
      window.URL.revokeObjectURL(data);
      link.remove();
    }, 100);

    setOutputFileExt("");
    setLoading(false);
  };

  const load = async () => {
    setLoading(true);
    await ffmpeg.load();
    setReady(true);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Media File Converter</h1>
        {video ? (
          <div className="flex items-center">
            <input
              value={selectedFileExt}
              disabled
              placeholder="from extention"
              className={styles.input}
            />
            <div className="m-2" />
            <input
              value={outputFileExt}
              disabled={loading ? true : false}
              onChange={(e) => setOutputFileExt(e.target.value)}
              placeholder="output extension"
              className={styles.input}
            />
          </div>
        ) : (
          <></>
        )}
        <div className="m-2" />
        <input
          ref={fileRef}
          onChange={onFileSelect}
          disabled={loading ? true : false}
          type="file"
          accept="image/*,video/*"
          className={styles.input}
        />
        <button
          onClick={initConvert}
          disabled={loading ? true : false}
          className="flex items-center justify-center border-0 p-3 bg-[#2563eb] rounded-md text-[#fff] mt-5 font-medium active:scale-90 transition-all"
        >
          {loading ? <Loader /> : <p>Convert 🚀</p>}
        </button>
      </main>
    </div>
  );
}

const styles = {
  page: `w-screen h-screen flex items-center justify-center`,
  main: `flex flex-col max-w-[500px] m-auto lg:shadow-md p-5 lg:p-10 rounded-lg`,
  title: `lg:text-4xl text-2xl font-bold mb-5`,
  input: `border p-3 w-[100%] rounded-md`,
};

export default App;
