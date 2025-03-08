const axios = require("axios");
const { exec } = require("child_process");

const YOUTUBE_API_KEY = "AIzaSyCs42WnWuVeoVTp-I1Vrr_Iloj0VUmhi7c";

async function searchYouTube(songName) {
  const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
    params: { part: "snippet", q: songName, key: YOUTUBE_API_KEY, maxResults: 1, type: "video" },
  });
  return response.data.items.length > 0 ? response.data.items[0].id.videoId : null;
}

async function ytDlpSearch(query) {
  return new Promise((resolve, reject) => {
    exec(`yt-dlp "ytsearch5:${query}" --print "%(title)s | %(id)s | %(url)s" --cookies-from-browser firefox`, (error, stdout, stderr) => {
      if (error) return reject(new Error("Error ejecutando yt-dlp: " + stderr));
      
      const results = stdout
        .trim()
        .split("\n")
        .map((line) => {
          const [title, id, url] = line.split(" | ");
          return { title, id, url, thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
        });

      resolve(results);
    });
  });
}

module.exports = { searchYouTube, ytDlpSearch };
