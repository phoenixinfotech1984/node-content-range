const http = require("http");
const port = process.env.PORT || 3000;

const { stat, createReadStream } = require("fs");
const { promisify } = require("util");
const { pipeline } = require("stream");
const sampleVideo = "./main.mp4";
const fileInfo = promisify(stat);

http
  .createServer(async (req, res) => {
   
    /** Calculate Size of file */
    const { size } = await fileInfo(sampleVideo);
    const range = req.headers.range;

    /** Check for Range header */
    if (range) {
      /** Extracting Start and End value from Range Header */
      let [start, end] = range.replace(/bytes=/, "").split("-");
      start = parseInt(start, 10);
      end = end ? parseInt(end, 10) : size - 1;

      if (!isNaN(start) && isNaN(end)) {
        start = start;
        end = size - 1;
      }
      if (isNaN(start) && !isNaN(end)) {
        start = size - end;
        end = size - 1;
      }

      // Handle unavailable range request
      if (start >= size || end >= size) {
        // Return the 416 Range Not Satisfiable.
        res.writeHead(416, {
          "Content-Range": `bytes */${size}`
        });
        return res.end();
      }

      /** Sending Partial Content With HTTP Code 206 */
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
        "Content-Type": "video/mp4"
      });

      let readable = createReadStream(sampleVideo, { start: start, end: end });
      pipeline(readable, res, err => {
        console.log(err);
      });

    } else {

      res.writeHead(200, {
        "Content-Length": size,
        "Content-Type": "video/mp4"
      });

      let readable = createReadStream(sampleVideo);
      pipeline(readable, res, err => {
        console.log(err);
      });

    }
  })
  .listen(port, () => console.log("Running on 3000 port"));
