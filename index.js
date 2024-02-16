const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const bodyParser = require('body-parser');
const { Client, Collection, Events, GatewayIntentBits, ActivityType } = require('discord.js');
const { token, guildId } = require('./config.json');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Initialize Express
const app = express();
const port = 3000;

// Parsing
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

// Function to set bot's status
function setBotStatus(status) {
  client.user.setActivity(status, { type: ActivityType.Watching });
  }

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/status', (req, res) => {
  const newStatus = req.body.status;
  setBotStatus(newStatus);
  res.send('Bot status updated to: ' + newStatus);
});

client.once(Events.ClientReady, () => {
  console.log('Ready!');
  client.user.setActivity('2024!', { type: ActivityType.Watching });
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
});

client.login(token)
    .then(() => {
        console.log('Bot logged in successfully.');
        // Start the Express server after bot login
        app.listen(port, () => {
            console.log(`Server is listening at http://localhost:${port}`);
        });
    })
    .catch((error) => {
        console.error('Error logging in:', error);
    });