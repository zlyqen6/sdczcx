const { AuditLogEvent, EmbedBuilder } = require('discord.js');

module.exports = {
  name: "messageDelete",
  async execute(message, client, dbl, db) {
    const logId = db.get(`logs_${message.guild.id}.MessageDelete`);
    if(message.author.bot || !logId) return;
    const fetchedLogs = await message.guild.fetchAuditLogs({ type: AuditLogEvent.MessageDelete, limit: 1 });
    const firstEntry = fetchedLogs.entries.first();
    let executorId, executor;
    
    if(Date.now() - firstEntry.createdTimestamp > 3000) executorId = message.member.id, executor = message.member;
    
    if(!logId) return;
    client.channels.cache.get(logId)?.send({ embeds: [new EmbedBuilder()
      .setTitle("Bir Mesaj Silindi!")
      .setDescription(`**Silinme Tarihi:** <t:${Math.floor(Date.now()/1000)}>\n**Silen Kişi:** <@${executorId}> (\`${executorId}\`)\n**Mesajı Silinen Üye:** <@${message.member.id}> (\`${message.member.id}\`)\n**Mesaj:** ${message.content?.slice(0, 3000) || "İçerik yok."}`)
      .setFooter({ text: "Covid-19 #code Guard", iconURL: message.guild.iconURL() })
    ] });
  },
};
