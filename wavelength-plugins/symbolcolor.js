'use strict';

const fs = require('fs');
let selectors;

function writeSymbolCSS() {
	fs.appendFile('config/custom.css', selectors);
}

exports.commands = {
	symbolcolor: function (target, user, room) {
		if (!this.can('forcewin')) return false;
		let args = target.split(',');
		if (args.length < 3) return this.parse('/help symbolcolor');
		let username = toId(args.shift());
		let color = 'color:' + args.shift().trim() + '-userlist-user-' + username + ' em.group';
		args.ForEach(function (room) {
			selectors += ', #' + toId(room) + '-userlist-user-' + username + ' em.group';
		});
		selectors += '{ \n' + ' ' + color + '\n }';
		this.sendReply('You have given ' + username + ' custom symbol color.');
		writeSymbolCSS();
	},
	symbolcolorhelp: ['/symbolcolor [username], [color], [room1], [room2] - set users symbol color in chosen rooms.'],
};
