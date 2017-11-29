'use strict';

const fs = require('fs');

// This should be the default amount of money users have.
// Ideally, this should be zero.
const DEFAULT_AMOUNT = 0;

global.coinsName = 'Coins';
global.coinsPlural = 'Coins';

let Coins = global.Coins = {
	/**
 	* Reads the specified user's money.
 	* If they have no money, DEFAULT_AMOUNT is returned.
 	*
 	* @param {String} userid
 	* @param {Function} callback
 	* @return {Function} callback
 	*/
	readCoins: function (userid, callback) {
		// In case someone forgot to turn `userid` into an actual ID...
		userid = toId(userid);
		if (userid.substring(0, 5) === 'guest') return 0;

		let amount = Db.coins.get(userid, DEFAULT_AMOUNT);
		if (callback && typeof callback === 'function') {
			// If a callback is specified, return `amount` through the callback.
			return callback(amount);
		} else {
			// If there is no callback, just return the amount.
			return amount;
		}
	},
	/**
 	* Writes the specified amount of money to the user's "bank."
 	* If a callback is specified, the amount is returned through the callback.
 	*
 	* @param {String} userid
 	* @param {Number} amount
 	* @param {Function} callback (optional)
 	* @return {Function} callback (optional)
 	*/
	writeCoins: function (userid, amount, callback) {
		// In case someone forgot to turn `userid` into an actual ID...
		userid = toId(userid);
		if (userid.substring(0, 5) === 'guest') return;

		// In case someone forgot to make sure `amount` was a Number...
		amount = Number(amount);
		if (isNaN(amount)) {
			throw new Error("Economy.writeCoins: Expected amount parameter to be a Number, instead received " + typeof amount);
		}

		let curTotal = Db.coins.get(userid, DEFAULT_AMOUNT);
		Db.coins.set(userid, curTotal + amount);
		let newTotal = Db.coins.get(userid);

		if (callback && typeof callback === 'function') {
			// If a callback is specified, return `newTotal` through the callback.
			return callback(newTotal);
		}
	},
	writeCoinsArr: function (users, amount) {
		for (let i = 0; i < users.length; i++) {
			this.writeCoins(users[i], amount);
		}
	},
	logCoins: function (message) {
		if (!message) return false;
		fs.appendFile('logs/coinslog.log', '[' + new Date().toUTCString() + '] ' + message + '\n', () => {});
	},
};

exports.commands = {
	'!coins': true,
	coins: 'coin',
	coin: function (target, room, user) {
		if (!target) target = user.name;
		if (!this.runBroadcast()) return;
		let userid = toId(target);
		if (userid.length < 1) return this.sendReply("/wallet - Please specify a user.");
		if (userid.length > 19) return this.sendReply("/wallet - [user] can't be longer than 19 characters.");

		Coins.readCoins(userid, coins => {
			this.sendReplyBox(WL.nameColor(target, true) + " has " + coins + ((coins === 1) ? " " + coinsName + "." : " " + coinsPlural + "."));
			//if (this.broadcasting) room.update();
		});
	},

	givecoin: 'givecoins',
	givecoins: function (target, room, user, connection, cmd) {
		if (!this.can('forcewin')) return false;
		if (!target) return this.sendReply("Usage: /" + cmd + " [user], [amount]");
		let splitTarget = target.split(',');
		if (!splitTarget[2]) return this.sendReply("Usage: /" + cmd + " [user], [amount], [reason]");
		for (let u in splitTarget) splitTarget[u] = splitTarget[u].trim();

		let targetUser = splitTarget[0];
		if (toId(targetUser).length < 1) return this.sendReply("/" + cmd + " - [user] may not be blank.");
		if (toId(targetUser).length > 19) return this.sendReply("/" + cmd + " - [user] can't be longer than 19 characters");

		let amount = Math.round(Number(splitTarget[1]));
		if (isNaN(amount)) return this.sendReply("/" + cmd + "- [amount] must be a number.");
		if (amount > 1000) return this.sendReply("/" + cmd + " - You can't give more than 1000 " + coinsName + " at a time.");
		if (amount < 1) return this.sendReply("/" + cmd + " - You can't give less than one " + coinsName + ".");

		let reason = splitTarget[2];
		if (reason.length > 100) return this.errorReply("Reason may not be longer than 100 characters.");
		if (toId(reason).length < 1) return this.errorReply("Please specify a reason to give " + coinsName + ".");

		Coins.writeCoins(targetUser, amount, () => {
			Coins.readCoins(targetUser, newAmount => {
				if (Users(targetUser) && Users(targetUser).connected) {
					Users.get(targetUser).popup('|html|You have received ' + amount + ' ' + (amount === 1 ? coinsName : coinsPlural) +
					' from ' + WL.nameColor(user.userid, true) + '.');
				}
				this.sendReply(targetUser + " has received " + amount + ((amount === 1) ? " " + coinsName + "." : " " + coinsPlural + "."));
				Coins.logCoins(user.name + " has given " + amount + ((amount === 1) ? " " + coinsName + " " : " " + coinsPlural + " ") + " to " + targetUser + ". (Reason: " + reason + ") They now have " + newAmount + (newAmount === 1 ? " " + coinsName + "." : " " + coinsPlural + "."));
			});
		});
	},

	takecoin: 'takecoins'
	takecoins: function (target, room, user, connection, cmd) {
		if (!this.can('forcewin')) return false;
		if (!target) return this.sendReply("Usage: /" + cmd + " [user], [amount]");
		let splitTarget = target.split(',');
		if (!splitTarget[2]) return this.sendReply("Usage: /" + cmd + " [user], [amount], [reason]");
		for (let u in splitTarget) splitTarget[u] = splitTarget[u].trim();

		let targetUser = splitTarget[0];
		if (toId(targetUser).length < 1) return this.sendReply("/" + cmd + " - [user] may not be blank.");
		if (toId(targetUser).length > 19) return this.sendReply("/" + cmd + " - [user] can't be longer than 19 characters");

		let amount = Math.round(Number(splitTarget[1]));
		if (isNaN(amount)) return this.sendReply("/" + cmd + "- [amount] must be a number.");
		if (amount > 1000) return this.sendReply("/" + cmd + " - You can't take more than 1000 " + coinsName + " at a time.");
		if (amount < 1) return this.sendReply("/" + cmd + " - You can't take less than one " + coinsName + ".");

		let reason = splitTarget[2];
		if (reason.length > 100) return this.errorReply("Reason may not be longer than 100 characters.");
		if (toId(reason).length < 1) return this.errorReply("Please specify a reason to give " + coinsName + ".");

		Coins.writeCoins(targetUser, -amount, () => {
			Coins.readCoins(targetUser, newAmount => {
				if (Users(targetUser) && Users(targetUser).connected) {
					Users.get(targetUser).popup('|html|' + WL.nameColor(user.userid, true) + ' has removed ' + amount + ' ' + (amount === 1 ? coinsName : coinsPlural) +
					' from you.<br />');
				}
				this.sendReply("You removed " + amount + ((amount === 1) ? " " + coinsName + " " : " " + coinsPlural + " ") + " from " + Chat.escapeHTML(targetUser));
            Coins.logCoins(user.name + " has taken " + amount + ((amount === 1) ? " " + coinsName + " " : " " + coinsPlural + " ") + " from " + targetUser + ". (Reason: " + reason + ") They now have " + newAmount + (newAmount === 1 ? " " + coinsName + "." : " " + coinsPlural + "."));
			});
		});
	},

	transfercoin: 'transfercoins',
		transfercoind: function (target, room, user, connection, cmd) {
		if (!target) return this.sendReply("Usage: /" + cmd + " [user], [amount]");
		let splitTarget = target.split(',');
		for (let u in splitTarget) splitTarget[u] = splitTarget[u].trim();
		if (!splitTarget[1]) return this.sendReply("Usage: /" + cmd + " [user], [amount]");

		let targetUser = (Users.getExact(splitTarget[0]) ? Users.getExact(splitTarget[0]).name : splitTarget[0]);
		if (toId(targetUser).length < 1) return this.sendReply("/" + cmd + " - [user] may not be blank.");
		if (toId(targetUser).length > 18) return this.sendReply("/" + cmd + " - [user] can't be longer than 18 characters.");

		let amount = Math.round(Number(splitTarget[1]));
		if (isNaN(amount)) return this.sendReply("/" + cmd + " - [amount] must be a number.");
		if (amount > 1000) return this.sendReply("/" + cmd + " - You can't transfer more than 1000 " + coinsName + " at a time.");
		if (amount < 1) return this.sendReply("/" + cmd + " - You can't transfer less than one " + coinsName + ".");
		Coins.readCoins(user.userid, coins => {
			if (coins < amount) return this.sendReply("/" + cmd + " - You can't transfer more " + coinsName + " than you have.");
			if (cmd !== 'transfercoin' && cmd !== 'transfercoins') {
				return this.popupReply('|html|<center>' +
					'<button class = "card-td button" name = "send" value = "/transfercoins ' + toId(targetUser) + ', ' + amount + '"' +
					'style = "outline: none; width: 200px; font-size: 11pt; padding: 10px; border-radius: 14px ; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4); box-shadow: 0px 0px 7px rgba(0, 0, 0, 0.4) inset; transition: all 0.2s;">' +
					'Confirm transfer to <br><b style = "color:' + WL.hashColor(targetUser) + '; text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.8)">' + Chat.escapeHTML(targetUser) + '</b></button></center>');
			}
			Coins.writeCoins(user.userid, -amount, () => {
				Coins.writeCoins(targetUser, amount, () => {
					Coins.readCoins(targetUser, firstAmount => {
						Coins.readCoins(user.userid, secondAmount => {
							this.popupReply("You sent " + amount + ((amount === 1) ? " " + coinsPlural : " " + coinsPlural) + " to " + targetUser);
							Coins.logCoins(
								user.name + " has transfered " + amount + ((amount === 1) ? " " + coinsPlural : " " + coinsPlural) + " to " + targetUser + "\n" +
								user.name + " now has " + secondAmount + " " + (secondAmount === 1 ? " " + coinsPlural : " " + coinsPlural) + " " +
								targetUser + " now has " + firstAmount + " " + (firstAmount === 1 ? " " + coinsPlural : " " + coinsPlural)
							);
							if (Users.getExact(targetUser) && Users.getExact(targetUser).connected) {
								Users.getExact(targetUser).send('|popup||html|' + WL.nameColor(user.name, true) + " has sent you " + amount + ((amount === 1) ? " " + coinsPlural : " " + coinsPlural));
							}
						});
					});
				});
			});
		});
	},

	coinslog: function (target, room, user) {
		if (!this.can('forcewin')) return false;
		if (!target) return this.sendReply("Usage: /coinslog [number] to view the last x lines OR /coinslog [text] to search for text.");
		let word = false;
		if (isNaN(Number(target))) word = true;
		let lines = fs.readFileSync('logs/coinslog.log', 'utf8').split('\n').reverse();
		let output = '';
		let count = 0;
		let regex = new RegExp(target.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), "gi"); // eslint-disable-line no-useless-escape

		if (word) {
			output += 'Displaying last 50 lines containing "' + target + '":\n';
			for (let line in lines) {
				if (count >= 50) break;
				if (!~lines[line].search(regex)) continue;
				output += lines[line] + '\n';
				count++;
			}
		} else {
			if (target > 100) target = 100;
			output = lines.slice(0, (lines.length > target ? target : lines.length));
			output.unshift("Displaying the last " + (lines.length > target ? target : lines.length) + " lines:");
			output = output.join('\n');
		}
		user.popup("|wide|" + output);
	},

	'!coinsladder': true,
	coinsladder: function (target, room, user) {
		if (!target) target = 100;
		target = Number(target);
		if (isNaN(target)) target = 100;
		if (!this.runBroadcast()) return;
		let keys = Db.coins.keys().map(name => {
			return {name: name, coins: Db.coins.get(name)};
		});
		if (!keys.length) return this.sendReplyBox("Coins ladder is empty.");
		keys.sort(function (a, b) { return b.money - a.coins; });
		this.sendReplyBox(rankLadder('Richest Users', coinsPlural, keys.slice(0, target), 'coins') + '</div>');
	},

	resetcoin: 'resetcoins',
	resetcoins: function (target, room, user) {
		if (!this.can('roomowner')) return false;
		if (!target) return this.parse('/help resetcoins');
		target = toId(target);
		Economy.writeCoins(target, 0);
		this.sendReply(target + " now has 0 " + coinsName + ".");
	},
	resetcoinshelp: ['/resetcoins [user] - Resets target user\'s coins to 0. Requires: &, ~'],

	coinstat: 'coinstats',
	coinstats: function (target, room, user) {
		if (!this.runBroadcast()) return;
		const users = Db.coins.keys().map(curUser => ({amount: Db.coins.get(curUser)}));
		const total = users.reduce((acc, cur) => acc + cur.amount, 0);
		let average = Math.floor(total / users.length) || 0;
		let output = "There " + (total > 1 ? "are " : "is ") + total + " " + (total > 1 ? coinsPlural : coinsName) + " circulating in the economy. ";
		output += "The average user has " + average + " " + (average > 1 ? coinsPlural : coinsName) + ".";
		this.sendReplyBox(output);
	},
};
