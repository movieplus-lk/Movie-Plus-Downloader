const { cmd } = require("../command");
const { MegaCmd } = require("@winkgroup/mega"); // Import MegaCmd from the library
const fs = require("fs");

cmd(
  {
    pattern: "get",
    desc: "Mega File Downloader",
    category: "pp",
    use: "/start <Mega File URL>",
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
      senderNumber,
      botNumber2,
      botNumber,
      pushname,
      isMe,
      isOwner,
      groupMetadata,
      groupName,
      participants,
      groupAdmins,
      isBotAdmins,
      isAdmins,
      reply,
    }
  ) => {
    try {
      const megaUrl = q; // Get the Mega URL passed by the user

      // Initialize MegaCmd with a unique locking word for concurrent access
      const megaCmd = await MegaCmd.get('movieLock');

      // Log in to Mega (replace with your Mega credentials)
      const loginResult = await megaCmd.login('your-email@mail.com', 'your-password');
      
      if (!loginResult) {
        return reply("⚠️ Failed to login to Mega. Please check your credentials.");
      }

      // Use MegaCmd to get the file from the given URL
      const remotePath = megaUrl;  // Mega file path from the URL
      const localPath = `./downloads/${remotePath.split('/').pop()}`;  // Save to local downloads folder
      
      const onTransfer = new EventEmitter();
      onTransfer.on('progress', (data) => {
        console.log(`${data.bytes} of ${data.totalBytes} (${data.percentage}%) transferred`);
      });

      // Start downloading the file
      await megaCmd.get(remotePath, localPath, { onTransfer });

      // Once downloaded, send the file to the user
      await conn.sendMessage(
        from,
        {
          document: fs.createReadStream(localPath),
          caption: `*Download Complete:* ${remotePath.split('/').pop()}`,
          mimetype: "application/octet-stream",
          fileName: `🎬MOVIEPLUS🎬 ${remotePath.split('/').pop()}`,
        },
        { quoted: mek }
      );

      // Clean up after sending the file
      fs.unlinkSync(localPath); // Delete the file after sending
      await megaCmd.logout();
    } catch (e) {
      console.log(e);
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
  }
);
