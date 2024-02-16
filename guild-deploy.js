const { REST } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const fs = require('fs');
const path = require('path');
const { Routes } = require('discord-api-types/v9');

const commandArray = [];
const foldersPath = path.join(__dirname, 'commands');

try {
  // Grab all the command folders from the commands directory
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);

      console.log(`Loaded command: ${file}`);
      commandArray.push(command.data);
    }
  }

  console.log('Commands:', commandArray);
} catch (error) {
  console.error('Error loading commands:', error);
}

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
  try {
    console.log(`Started refreshing ${commandArray.length} application (/) commands.`);

    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commandArray },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error('Error refreshing commands:', error);
  }
})();