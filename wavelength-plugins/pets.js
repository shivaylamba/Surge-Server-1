'use strict';
/********************
* Pets *
Skrub's Pet System: Credit to wgc :3
Fixed And Modified By Prince Sky.
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

const tourPetRarity = ['No Pet', 'Common', 'Uncommon', 'Rare', 'Epic', 'Epic', 'Legendary', 'Legendary', 'Mythic'];
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
		search: function (target, room, user) {
			const letters = "abcdefghijklmnopqrstuvwxyz".split("");
			const categories = {
				Rarity: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'],// rarities
				Packs: ['XY-Promo', 'XY-Base', 'XY-Flashfire', 'XY-Furious Fists', 'XY-Phantom Forces', 'XY-Primal Clash', 'XY-Roaring Skies', 'XY-Ancient Origins', 'Double Crisis'],
				Types: ['Water', 'Fire', 'Fighting', 'Fairy', 'Dragon', 'Colorless', 'Psychic', 'Lightning', 'Darkness', 'Grass', 'Metal'],
				Tiers: ['OU-Pack', 'UU-Pack', 'Uber-Pack', 'PU-Pack', 'NU-Pack', 'RU-Pack', 'LC-Pack', 'BL-Pack', 'BL2-Pack', 'BL3-Pack'],
				Generation: ['Gen1', 'Gen2', 'Gen3', 'Gen4', 'Gen5', 'Gen6'],
				Miscellaneous: ['Trainer', 'Supporter', 'Item', 'Stadium', 'Energy', 'Delta', 'EX-Pack', 'Mega', 'Legendary', 'Full', 'Event'],
			};
			const scrollable = "<div style=\"max-height: 300px; overflow-y: scroll\">";// code for scrollable html
			const divEnd = "</div>";
			const definePopup = "|wide||html|<center><b>PetSearch</b></center><br />";
			const generalMenu = "<center>" +
					'<button name="send" value="/pet search gen" style=\"background-color:aliceblue;height:30px\">Alphabetical</button>&nbsp;&nbsp;' +// alphabetical
					'<button name="send" value="/searchpet category" style=\"background-color:aliceblue;height:30px\">Categories</button>&nbsp;&nbsp;' +//category
					'</center><br />';
			if (!target) {
				return user.popup(definePopup + generalMenu);
			}
			//quick fix for when target ends with a comma
			target = target.replace(/\,[\s]+$/i, "");
			let parts = target.split(",");
			let actionCommand = parts.shift();
			let petDisplay;
			switch (toId(actionCommand)) {
				case 'letter':
					let letter = toId(parts[0]);
					const letterMenu = '<center>' + letters.map(l => {
						return '<button name="send" value="/searchpet letter, ' + l + '" ' + (letter === l ? "style=\"background-color:lightblue;height:30px;width:35px\"" : "style=\"background-color:aliceblue;height:30px;width:35px\"") + ">" + l.toUpperCase() + "</button>";
					}).join("&nbsp;") + "</center><br />";
					if (!letter || letters.indexOf(letter) === -1) {// invalid letter to search for, or none given//only show menu
						return user.popup(definePopup + generalMenu + letterMenu);
					}
					// sort pets by letter
					let letterMons = {};
					for (let m in pets) {
						if (!letterMons[m.charAt(0)]) letterMons[m.charAt(0)] = {};
						letterMons[m.charAt(0)][m] = 1;
					}
					if (!letterMons[letter]) return user.popup(definePopup + generalMenu + letterMenu);
					// make graphics for the letter
					petDisplay = Object.keys(letterMons[letter]).sort().map(m => {
						let pet = pets[m];
						return '<button name="send" value="/searchpet pet, ' + pet.title + '" style="border-radius: 12px; box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2) inset;" class="pet-button"><img src="' + pet.pet + '" width="100" title="' + pet.name + '"></button>';
					}).join("&nbsp;");
					//send the popup
					user.lastPetSearch = target;
					user.popup(definePopup + generalMenu + letterMenu + scrollable + petDisplay + divEnd);
					break;
				case 'category':
					// clean all the parts first
					parts = parts.map(p => {
						return toId(p);
					});
					// create category menu
					let categoryMenu = ""; for (let c in categories) {
						categoryMenu += '<b>' + c + ' -</b> ' + categories[c].map(k => {
							let m = toId(k);
							// add a special search condition for rarity
							if (c === "Rarity") m += "rarity";
							// new params for the search
							// clone parts
							let newParams = parts.slice(0);
							if (parts.indexOf(m) > -1) {
								// remove it
								newParams.splice(newParams.indexOf(m), 1);
							} else {
								newParams.push(m);
							}
							let style = (parts.indexOf(m) > -1 ? "style=\"background-color:lightblue;height:23\"" : "style=\"background-color:aliceblue;height:23\"");
							// button style checking if currently searching
							return '<button name="send" value="/searchpet category, ' + newParams.join(", ") + '" ' + style + '>' + k + '</button>';
						}).join("&nbsp;") + "<br />";
					}
					if (!parts.length) {
						return user.popup(definePopup + generalMenu + categoryMenu);
					}
					// now clone the pets and delete the ones who dont match the categories
					let paramPets = Object.assign({}, pets);
					// filter out the unneeded ones; ignore rarity
					for (let i = 0; i < parts.length; i++) {
						let param = parts[i];
						// ignore rarity
						if (/rarity$/i.test(param)) continue;
						for (let c in paramPets) {
							let petParams = paramPets[c].gen.join("~").toLowerCase().replace(/[^a-z0-9\~]/g, "").split("~");
							if (petParams.indexOf(param) === -1) delete paramPets[c];
							// remove the pet from the currently searched ones
						}
					}
					// seperate check for rarity
					let rarityCheck = parts.some(a => {
						return /rarity$/i.test(a);
					});
					if (rarityCheck) {
						for (let c in paramPets) {
							let petRare = toId(paramPets[c].rarity);
							for (let i = 0; i < parts.length; i++) {
								if (/rarity$/i.test(parts[i])) {
									// check if rarity is the pet's rarity
									if (parts[i].replace(/rarity$/i, "") !== petRare) {
										// remove if not matched delete
										paramPets[c];
									}
								}
							}
						}
					}
					// no pets left
					if (!Object.keys(pets).length) {
						return user.popup(definePopup + generalMenu + categoryMenu + '<br /><center><font color="red"><b>Nothing matches your search</b></font></center>');
					}
					user.lastPetSearch = target;
					// build the display
					petDisplay = Object.keys(paramPets).sort().map(m => {
						let pet = paramPets[m];
						return '<button name="send" value="/petsearch pet, ' + pet.title + '" style="border-radius: 12px; box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2) inset;" class="pet-button"><img src="' + pet.pet + '" width="100" title="' + pet.name + '"></button>';
					}).join("&nbsp;");
					user.popup(definePopup + generalMenu + categoryMenu + scrollable + petDisplay + divEnd);
					break;
				case 'pet':
					let backButton = '<button name="send" value="/petsearch ' + user.lastPetSearch + '" style="background-color:aliceblue;height:30px;width:35">&lt;&nbsp;Back</button><br /><br />';
					if (!parts[0] || !(toId(parts[0]) in pets)) {
						return user.popup(definePopup + backButton + '<center><font color="red"><b>Invalid Pet</b></font></center>');
					}
					// build the display screen for the pet
					let pet = pets[toId(parts[0])];
					// the image
					let petImage = '<img src="' + pet.pet + '" height=250>';
					// the name of the pet
					let petName = "<b>Name:</b> " + pet.name + "<br />";
					// the id of the pet
					let petId = "<font color=\"gray\">(" + pet.title + ")</font><br />";
					// rarity display
					let petRarityPoints = '<b>Rarity: </b><font color="' + colors[pet.rarity] + '">' + pet.rarity + '</font> (' + pet.points + ')<br />';
					// get users that have the pet
					let allPetUsers = Db('pets').object();
					let petHolders = [];
					// dont allow duplicates
					for (let u in petUsers) {
						let userData = allPetUsers[u];
						for (let i = 0; i < userData.length; i++) {
							let tC = userData[i];
							if (tC && tC.title === pet.title) {
								if (!petHolders[u]) petHolders[u] = 0; petHolders[u]++;
							}
						}
					}
					// show duplicates as (x#)
					petHolders = Object.keys(petHolders).sort().map(u => {
						return "&nbsp;- " + u + (petHolders[u] > 1 ? " (x" + petHolders[u] + ")" : "");
					});
					// build the display!
					petDisplay = "<center><table><tr>" +
						"<td>" + petImage + "</td>" +
						"<td>" +
						petName + petId + petRarityPoints + petgen +
						"<b>Users with this pet:</b><br />" +
						"<div style=\"max-height: 130px; overflow-y: scroll\">" +
						petHolders.join("<br />") + "<br />" +
						"</td></tr></table></center>";
					user.popup(definePopup + backButton + petDisplay);
					break;
				case 'error':
				default:
					user.popup(definePopup + generalMenu + '<br /><center><font color="red"><b>Invalid Command action for PetSearch</b></font></center>');
					break;
												}
		},
	},
};
