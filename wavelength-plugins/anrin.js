  'use strict';


exports.commands = {
  
    s: 'spank',
	spank: function (target, room, user) {
		if (!target) return this.sendReply('/spank needs a target.');
		this.parse('/me spanks ' + target + '!');
	},
	punt: function (target, room, user) {
		if (!target) return this.sendReply('/punt needs a target.');
		this.parse('/me punts ' + target + ' to the moon!');
	},
	crai: 'cry',
	cry: function (target, room, user) {
		this.parse('/me starts tearbending dramatically like Katara~!');
	},
	dk: 'dropkick',
	dropkick: function (target, room, user) {
		if (!target) return this.sendReply('/dropkick needs a target.');
		this.parse('/me dropkicks ' + target + ' across the Pok\u00E9mon Stadium!');
	},
	fart: function (target, room, user) {
		if (!target) return this.sendReply('/fart needs a target.');
		this.parse('/me farts on ' + target + '\'s face!');
	},
	poke: function (target, room, user) {
		if (!target) return this.sendReply('/poke needs a target.');
		this.parse('/me pokes ' + target + '.');
	},
	pet: function (target, room, user) {
		if (!target) return this.sendReply('/pet needs a target.');
		this.parse('/me pets ' + target + ' lavishly.');
	},
	utube: function (target, room, user) {
		if (user.userid !== 'surgebot') return false;
		let commaIndex = target.indexOf(',');
		if (commaIndex < 0) return this.errorReply("You forgot the comma.");
		let targetUser = toId(target.slice(0, commaIndex));
		let message = target.slice(commaIndex + 1).trim();
		if (!targetUser || !message) return this.errorReply("Needs a target.");
		if (!Users.get(targetUser).name) return false;
		room.addRaw(Gold.nameColor(Users.get(targetUser).name, true) + '\'s link: <b>"' + message + '"</b>');
	},
	mt: 'mktour',
	mktour: function (target, room, user) {
		if (!target) return this.errorReply("Usage: /mktour [tier] - creates a tournament in single elimination.");
		target = toId(target);
		let t = target;
		if (t === 'rb') t = 'randombattle';
		if (t === 'cc1v1' || t === 'cc1vs1') t = 'challengecup1v1';
		if (t === 'randmono' || t === 'randommonotype') t = 'monotyperandombattle';
		if (t === 'mono') t = 'monotype';
		if (t === 'ag') t = 'anythinggoes';
		if (t === 'ts') t = 'tiershift';
		this.parse('/tour create ' + t + ', elimination');
	},
	pic: 'image',
	image: function (target, room, user) {
		if (!target) return this.sendReply('/image [url] - Shows an image using /a. Requires ~.');
		this.parse('/a |raw|<center><img src="' + target + '">');
	},
	halloween: function (target, room, user) {
		if (!target) return this.sendReply('/halloween needs a target.');
		this.parse('/me takes ' + target + '\'s pumpkin and smashes it all over the Pok\u00E9mon Stadium!');
	},
	barn: function (target, room, user) {
		if (!target) return this.sendReply('/barn needs a target.');
		this.parse('/me has barned ' + target + ' from the entire server!');
	},
	lick: function (target, room, user) {
		if (!target) return this.sendReply('/lick needs a target.');
		this.parse('/me licks ' + target + ' excessively!');
	},

	
	'!hex': true,
	gethex: 'hex',
	hex: function (target, room, user) {
		if (!this.runBroadcast()) return;
		if (!this.canTalk()) return;
		if (!target) target = toId(user.name);
		return this.sendReplyBox(`${Gold.nameColor(target.trim(), true)}.  The hexcode for this name color is: ${Gold.hashColor(target)}.`);
	},
	rsi: 'roomshowimage',
	roomshowimage: function (target, room, user) {
		if (!this.can('ban', null, room)) return false;
		if (!target) return this.parse('/help roomshowimage');
		let parts = target.split(',');
		if (!this.runBroadcast()) return;
		this.sendReplyBox("<img src=" + parts[0] + " width=" + parts[1] + " height=" + parts[1]);
	},
	roomshowimagehelp: ["!rsi [image], [width], [height] - Broadcasts an image to the room"],
	'!usersofrank': true,
	admins: 'usersofrank',
	uor: 'usersofrank',
	usersofrank: function (target, room, user, connection, cmd) {
		if (cmd === 'admins') target = '~';
		if (!target || !Config.groups[target]) return this.parse('/help usersofrank');
		if (!this.runBroadcast()) return;
		let names = [];
		for (let users of Users.users) {
			users = users[1];
			if (Users(users).group === target && Users(users).connected) {
				names.push(Users(users).name);
			}
		}
		if (names.length < 1) return this.sendReplyBox('There are no users of the rank <font color="#24678d"><b>' + Chat.escapeHTML(Config.groups[target].name) + '</b></font> currently online.');
		return this.sendReplyBox('There ' + (names.length === 1 ? 'is' : 'are') + ' <font color="#24678d"><b>' + names.length + '</b></font> ' + (names.length === 1 ? 'user' : 'users') + ' with the rank <font color="#24678d"><b>' + Config.groups[target].name + '</b></font> currently online.<br />' + names.join(', '));
	},
		golddeclare: function (target, room, user, connection, cmd) {
		if (!target) return this.parse('/help declare');
		if (!this.can('declare', null, room)) return false;
		if (!this.canTalk()) return;
		this.add('|raw|<div class="broadcast-gold"><b>' + target + '</b></div>');
		this.logModCommand(user.name + ' declared ' + target);
	},
	pdeclare: function (target, room, user, connection, cmd) {
		if (!target) return this.parse('/help declare');
		if (!this.can('declare', null, room)) return false;
		if (!this.canTalk()) return;
		if (cmd === 'pdeclare') {
			this.add('|raw|<div class="broadcast-purple"><b>' + target + '</b></div>');
		} else if (cmd === 'pdeclare') {
			this.add('|raw|<div class="broadcast-purple"><b>' + target + '</b></div>');
		}
		this.logModCommand(user.name + ' declared ' + target);
	},
	staffdeclare: 'moddeclare',
	modmsg: 'moddeclare',
	declaremod: 'moddeclare',
	moddeclare: function (target, room, user) {
		if (!target) return this.parse('/help moddeclare');
		if (!this.can('declare', null, room)) return false;
		if (!this.canTalk()) return;
		let declareHTML = Chat.html`<div class="broadcast-red"><i>Private Staff Message (Driver+) from ${user.name}:</i><br /><strong>${target}</strong></div>`;
		this.privateModCommand(`|raw|${declareHTML}`);
		this.logModCommand(`${user.name} mod declared ${target}`);
	},
	moddeclarehelp: ["/declaremod [message] - Displays a red [message] to all authority in the respected room.  Requires * # & ~"],
	
	
}