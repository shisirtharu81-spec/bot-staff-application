const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const express = require('express');
require('dotenv').config();

// 1. EXPRESS SERVER (Bot ko 24/7 jagaye rakhne ke liye)
const app = express();
app.get('/', (req, res) => {
    res.send('Bot is 24/7 Online!');
});
app.listen(process.env.PORT || 3000, () => {
    console.log("Web server ready.");
});

// 2. DISCORD BOT SETUP
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

let isApplicationOpen = true; 

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Commands
client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;

    if (message.content === '!setup-app') {
        if (!message.member.permissions.has('Administrator')) return message.reply("Aapke paas permission nahi hai.");

        const embed = new EmbedBuilder()
            .setTitle("📝 Staff Recruitment")
            .setDescription("Agar aap hamare server ke staff banna chahte hain, toh neeche diye gaye button par click karke form bharein.")
            .setColor("#0099ff");

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('apply_btn')
                .setLabel('Apply Now')
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }

    if (message.content === '!app-toggle') {
        if (!message.member.permissions.has('Administrator')) return message.reply("Aapke paas permission nahi hai.");

        isApplicationOpen = !isApplicationOpen;
        const status = isApplicationOpen ? "🟢 OPEN" : "🔴 CLOSED";
        await message.reply(`Staff Applications ab **${status}** ho chuke hain!`);
    }
});

// Interaction Handling (Buttons & Modals)
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'apply_btn') {
        if (!isApplicationOpen) {
            return await interaction.reply({ content: "Sorry! Staff applications abhi closed hain.", ephemeral: true });
        }

        const modal = new ModalBuilder().setCustomId('staff_modal').setTitle('Staff Application Form');

        const ageInput = new TextInputBuilder().setCustomId('app_age').setLabel('Aapki Age kya hai?').setStyle(TextInputStyle.Short).setRequired(true);
        const reasonInput = new TextInputBuilder().setCustomId('app_reason').setLabel('Hum aapko staff kyu banayein?').setStyle(TextInputStyle.Paragraph).setRequired(true);
        const experienceInput = new TextInputBuilder().setCustomId('app_exp').setLabel('Kya pehle koi experience hai?').setStyle(TextInputStyle.Paragraph).setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(ageInput),
            new ActionRowBuilder().addComponents(reasonInput),
            new ActionRowBuilder().addComponents(experienceInput)
        );
        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'staff_modal') {
        const age = interaction.fields.getTextInputValue('app_age');
        const reason = interaction.fields.getTextInputValue('app_reason');
        const exp = interaction.fields.getTextInputValue('app_exp') || "None";

        const logChannel = client.channels.cache.get(process.env.APPLICATION_CHANNEL_ID);

        const appEmbed = new EmbedBuilder()
            .setTitle("New Staff Application!")
            .setColor("#32a852")
            .addFields(
                { name: 'Applicant', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                { name: 'Age', value: age, inline: true },
                { name: 'Reason', value: reason },
                { name: 'Experience', value: exp }
            )
            .setTimestamp();

        if (logChannel) {
            await logChannel.send({ embeds: [appEmbed] });
            await interaction.reply({ content: "Aapka application submit ho gaya hai!", ephemeral: true });
        } else {
            await interaction.reply({ content: "Error: Log channel nahi mila.", ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);