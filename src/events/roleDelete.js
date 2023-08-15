const { AuditLogEvent } = require('discord.js');

module.exports = {
	name: 'roleDelete',
	async execute(role, client, dbl, db) {
    const fetchedLogs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 });
    const firstEntry = fetchedLogs.entries.first();
    
    if(role.guild.members.cache.get(firstEntry.executorId).id === role.guild.ownerId || db.get(`verify_${role.guild.id}`)?.includes(firstEntry.executorId) || firstEntry.executorId === client.user.id || !db.get(`guards_${role.guild.id}.RoleDelete`)) return;
    await role.guild.roles.create(role.toJSON()).then(async x => await x.setPosition(role.position-1)).catch(e=>{});
  },
};
