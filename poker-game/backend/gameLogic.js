const RANKS = '23456789TJQKA';
const SUITS = 'cdhs'; // Червы, бубны, трефы, пики

// Функция для создания колоды
function createDeck() {
  const deck = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push(`${rank}${suit}`);
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

// Функция раздачи карт
function dealCards(players) {
  const deck = createDeck();
  for (const playerId in players) {
    players[playerId].hand = [deck.pop(), deck.pop()];
  }
}

module.exports = {
  dealCards,
};



function splitPot(winners, pot) {
    const share = Math.floor(pot / winners.length);
    winners.forEach(player => {
      player.chips += share;
    });
  }
  
  function getHandRank(hand) {
    // Здесь реализуем логику оценки комбинаций, как описано ранее
    return { rank: 1, name: 'High Card' }; // Упростим для примера
  }
  
  function determineWinner(players, communityCards) {
    let bestHandRank = { rank: 0 };
    const potentialWinners = [];
  
    for (const playerId in players) {
      const player = players[playerId];
      if (player.isFolded) continue;
  
      const fullHand = [...player.hand, ...communityCards];
      const handRank = getHandRank(fullHand);
  
      if (handRank.rank > bestHandRank.rank) {
        bestHandRank = handRank;
        potentialWinners.length = 0;
        potentialWinners.push(player);
      } else if (handRank.rank === bestHandRank.rank) {
        potentialWinners.push(player);
      }
    }
  
    return potentialWinners;
  }
  
  module.exports = {
    determineWinner,
    splitPot,
  };
  