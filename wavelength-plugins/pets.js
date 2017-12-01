'use strict';
/********************
* Pets *
Skrub's Pet System: Credit to wgc :3
********************/

const uuid = require('uuid');
const pets = require('../wavelength-plugins/pets-data.js');
let color = require('../config/color');
let rankLadder = require('../rank-ladder');

const colors = {
	Mythic: '#D82A2A',
	Legendary: '#E8AB03',
	Epic: '#73DF14',
	Rare: '#2DD1B6',
	Uncommon: '#2D3ED1',
	Common: '#000',
};

const tourPetsRarity = ['No Pet', 'Common', 'Uncommon', 'Rare', 'Epic', 'Epic', 'Legendary', 'Legendary', 'Mythic'];
const petRarity = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];
let cleanShop = [];
let cleanPet = [];
let rareCache = [];//Used to cache pets for tours

function cacheRarity() {
	for (let i = 0; i < petRarity.length; i++) {
		rareCache.push([]); for (let key in pets) {
			if (pets.hasOwnProperty(key)) {
				let obj = pets[key];
				if (obj.hasOwnProperty('rarity') && obj.rarity.indexOf(petRarity[i]) > -1) rareCache[i].push(key);
			}
		}
	}
}

global.tourPet = function (tourSize, userid) {
	if (tourSize > 32) tourSize = 32;
	let tourRarity = tourPetRarity[Math.floor(tourSize / 4)];
	let cacheValue = rareCache[cleanPet.indexOf(toId(tourRarity))];
	let pet = cacheValue[Math.round(Math.random() * (cacheValue.length - 1))];
	if (tourRarity === 'No Pet') return; addPet(userid, pet);
	return [colors[pets[pet].rarity], pets[pet].rarity, pets[pet].title, pets[pet].name];
};

function addPet(name, pet) {
	let newPet = {};
	newPet.id = uuid.v1();
	newPet.title = pets[pet].title;
	newPet.pet = pets[pet].pet;
	newPet.name = pets[pet].name;
	newPet.rarity = pets[pet].rarity;
	newPet.points = pets[pet].points;
	let userid = toId(name);
	Db('pets').set(userid, Db('pets').get(userid, []).concat([newPet]));
	Db('points').set(userid, Db('points').get(userid, 0) + newPet.points);
}

function removePet(petTitle, userid) {
	let userPets = Db('pets').get(userid, []);
	let idx = -1;// search for index of the pet
	for (let i = 0; i < userPets.length; i++) {
		let pet = userPets[i];
		if (pet.title === petTitle) {
			idx = i; break;
		}
	}
	if (idx === -1) return false;// remove it
	userPets.splice(idx, 1);//set it in db
	Db('userPets').set(userid, userPets);
	return true;
}

function getPetPointTotal(userid) {
	let totalPets = Db('pets').get(userid, []);
	let total = 0; for (let i = 0; i < pets.length; i++) {
		total += totalPets[i].points;
	}
	return total;
}

function toTitleCase(str) {
	return str.replace(/(\w\S*)/g, function (txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
}
cacheRarity();

exports.commands = {
	pets: 'pet',
	pet: {
		showcase: function (target, room, user) {
			if (!this.runBroadcast()) return;
			let userid = user.userid;
			if (target) userid = toId(target);
			const pets = Db('pets').get(userid, []);
			if (!pets.length) return this.sendReplyBox(userid + " has no pets.");
			const petsMapping = pets.map(function (pet) {
				return '<button name="send" value="/pet info ' + pet.title + '" style="border-radius: 12px; box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2) inset;" class="pet-button"><img src="' + pet.pet + '" height="80" title="' + pet.name + '"></button>';
			});
			this.sendReplyBox('<div style="max-height: 300px; overflow-y: scroll;">' + petsMapping.join('') + '</div><br><center><b><font color="' + color(userid) + '">' + userid + '</font> has ' + pets.length + ' Pets.');
		},
		
		info: function (target, room, user) {
			if (!target) return this.sendReply("/pet [name] - Shows information about a pet.");
			if (!this.runBroadcast()) return; let petName = toId(target);
			if (!pets.hasOwnProperty(petName)) return this.sendReply(target + ": pet not found.");
			let pet = pets[petName];
			let html = '<div class="pet-div pet-td" style="box-shadow: 2px 3px 5px rgba(0, 0, 0, 0.2);"><img src="' + pet.pet + '" width="96" title="' + pet.name + '" align="right">' +
				 '<span class="pet-name" style="border-bottom-right-radius: 2px; border-bottom-left-radius: 2px; background-image: -moz-linear-gradient(center top , #EBF3FC, #DCE9F9); box-shadow: 0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 0px 2px rgba(0, 0, 0, 0.2); font-size: 30px;">' + pet.title + '</span>' +
				 '<br /><br /><h1><font color="' + colors[pet.rarity] + '">' + pet.rarity + '</font></h1>' +
				 '<br /><br /><font color="#AAA"><i>Points:</i></font> ' + pet.points + '<br clear="all">';
			this.sendReply('|raw|' + html);
		},
		
		ladder: function (target, room, user) {
			if (!this.runBroadcast()) return;
			let keys = Object.keys(Db('points').object()).map(function (name) {
				return {name: name, points: getPetPointTotal(name)};
			});
			if (!keys.length) return this.sendReplyBox("Pet ladder is empty.");
			keys.sort(function (a, b) { return b.points - a.points; });
			this.sendReplyBox(rankLadder('Pet Ladder', 'Points', keys.slice(0, 100), 'points'));
		},
	},
};
