  const { cmd, commands } = require("../command");
  const fetch = require("node-fetch");
  const { fetchJson } = require("../lib/functions");
  const axios = require("axios");

  cmd(
    {
      pattern: "get",
      desc: "Fetch and upload movie file",
      category: "downloads",
      use: "/start < Movie Slug >",
      filename: __filename,
    },
    async (
      conn,
      mek,
      m,
      {
        from,
        quoted,
        body,
        isCmd,
        command,
        args,
        q,
        isGroup,
        sender,
        pushname,
        reply,
      },
    ) => {
      try {
        // Validate input
        if (!q || q.trim() === "") {
          return reply("❌ Please provide a valid movie slug.");
        }

        // Sanitize input
        const sanitizedSlug = encodeURIComponent(q.trim());

        let data = await fetchJson(
          `http://links.server.moviepluslk.xyz/api.php?slug=${sanitizedSlug}`,
        );

        // Robust error checking
        if (!data || !Array.isArray(data) || data.length === 0) {
          return reply(
            "⚠️ Unable to find the requested file. Possible reasons:\n" +
              "- Token might have expired\n" +
              "- Link may be invalid\n" +
              "- Please try reloading the download page",
          );
        }

        let fileInfo = data[0];
        let size = fileInfo.file_size || "Unknown";
        let downloadlink = fileInfo.mega_link || fileInfo.download_link;
        let title = fileInfo.file_name || "Untitled File";

        // Validate download link exists
        if (!downloadlink) {
          console.error("No download link found in file info:", fileInfo);
          return reply(
            "❌ Download link is unavailable. Please contact support.",
          );
        }

        // Prepare processing message
        const processingMessage = `📁 File Details:
  - Name: ${title}
  - Size: ${size}

  🔄 Downloading and preparing file for upload, please wait...`;

        // Send initial message
        await conn.sendMessage(from, {
          text: processingMessage,
          quoted: mek,
        });

        // React to show processing
        await conn.sendMessage(from, {
          react: { text: "📥", key: mek.key },
        });

        // Send file directly without link verification
        await conn.sendMessage(
          from,
          {
            document: { url: downloadlink },
            caption: `🎬 ${title}`,
            mimetype: "video/mp4",
            fileName: `${title.replace(/[^\w\s]/gi, '')}.mp4`, // Clean filename
          },
          { quoted: mek },
        );

        // Final success reactions
        await conn.sendMessage(from, {
          react: { text: "✅", key: mek.key },
        });
      } catch (error) {
        console.error("Processing error:", error);

        // Error handling based on error type
        let errorMessage = "❌ An error occurred while processing your request.";

        if (error.message.includes("timeout")) {
          errorMessage = "⌛ The operation timed out. Please try again.";
        } else if (error.message.includes("file size")) {
          errorMessage = "📁 The file is too large to upload.";
        }

        await conn.sendMessage(
          from,
          { text: errorMessage },
          { quoted: mek },
        );
      }
    },
  );

  module.exports = { cmd };
