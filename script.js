// BBL Multi Builder JavaScript
const API_BASE_URL = 'http://localhost:8000';

// Global state
let currentMatchup = null;
let selectedWinner = null;
let selectedSixLock = null;
let selectedWicketLock = null;
let recommendations = [];
let selectedBets = [];
let selectedPlayers = [];
let allPlayers = [];
let matchupPlayers = [];

// DOM elements
const matchupSelect = document.getElementById('matchupSelect');
const winnerPredictionSection = document.getElementById('winnerPredictionSection');
const team1Btn = document.getElementById('team1Btn');
const team2Btn = document.getElementById('team2Btn');
const buildMultiBtn = document.getElementById('buildMultiBtn');
// Removed recommendationsSection as it's no longer in HTML
const selectedBetsSection = document.getElementById('selectedBets');
const selectedBetsList = document.getElementById('selectedBetsList');
const viewBetSlipBtn = document.getElementById('viewBetSlipBtn');
const legCount = document.getElementById('legCount');
const playerStatsSection = document.getElementById('playerStatsSection');
const battingStatsList = document.getElementById('battingStatsList');
const bowlingStatsList = document.getElementById('bowlingStatsList');
const selectableRecommendationsSection = document.getElementById('selectableRecommendationsSection');
const selectableRecommendationsList = document.getElementById('selectableRecommendationsList');
const lockSelectionsSection = document.getElementById('lockSelectionsSection');
const sixLockSelect = document.getElementById('sixLockSelect');
const wicketLockSelect = document.getElementById('wicketLockSelect');
const lockSelectionsDisplay = document.getElementById('lockSelectionsDisplay');
const additionalRecommendationsList = document.getElementById('additionalRecommendationsList');

// DOM elements are properly initialized

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadMatchups();
    setupEventListeners();
    
    // Application initialized
});

// Setup event listeners
function setupEventListeners() {
    matchupSelect.addEventListener('change', handleMatchupSelection);
    team1Btn.addEventListener('click', () => selectWinner('team1'));
    team2Btn.addEventListener('click', () => selectWinner('team2'));
    sixLockSelect.addEventListener('change', handleSixLockSelection);
    wicketLockSelect.addEventListener('change', handleWicketLockSelection);
    buildMultiBtn.addEventListener('click', handleBuildMulti);
    viewBetSlipBtn.addEventListener('click', handleViewBetSlip);
}

// Load available matchups
async function loadMatchups() {
    try {
        const response = await fetch(`${API_BASE_URL}/matchups`);
        const data = await response.json();
        
        matchupSelect.innerHTML = '<option value="">Select a matchup...</option>';
        
        data.matchups.forEach(matchup => {
            const option = document.createElement('option');
            option.value = matchup.id;
            option.textContent = matchup.matchup;
            option.dataset.team1 = matchup.team1;
            option.dataset.team2 = matchup.team2;
            matchupSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading matchups:', error);
        matchupSelect.innerHTML = '<option value="">Error loading matchups</option>';
    }
}

// Handle matchup selection
function handleMatchupSelection() {
    const selectedOption = matchupSelect.options[matchupSelect.selectedIndex];
    
    if (selectedOption.value) {
        currentMatchup = {
            id: selectedOption.value,
            team1: selectedOption.dataset.team1,
            team2: selectedOption.dataset.team2,
            matchup: selectedOption.textContent
        };
        
        // Update team buttons
        team1Btn.querySelector('.team-name').textContent = currentMatchup.team1;
        team2Btn.querySelector('.team-name').textContent = currentMatchup.team2;
        
        // Show winner prediction section
        winnerPredictionSection.style.display = 'block';
        
        // Enable team buttons
        team1Btn.disabled = false;
        team2Btn.disabled = false;
        
        // Reset selections
        resetSelections();
    } else {
        currentMatchup = null;
        winnerPredictionSection.style.display = 'none';
        team1Btn.disabled = true;
        team2Btn.disabled = true;
        team1Btn.querySelector('.team-name').textContent = 'Select Matchup First';
        team2Btn.querySelector('.team-name').textContent = 'Select Matchup First';
        resetSelections();
    }
}

// Select winner team
function selectWinner(team) {
    if (!currentMatchup) return;
    
    selectedWinner = team === 'team1' ? currentMatchup.team1 : currentMatchup.team2;
    
    // Update button states
    team1Btn.classList.toggle('selected', team === 'team1');
    team2Btn.classList.toggle('selected', team === 'team2');
    
    // Show lock selections and populate dropdowns
    lockSelectionsSection.style.display = 'block';
    populateLockDropdowns(selectedWinner);
    
    // Reset lock selections
    selectedSixLock = null;
    selectedWicketLock = null;
    sixLockSelect.value = '';
    wicketLockSelect.value = '';
    lockSelectionsDisplay.style.display = 'none';
    
    // Update build multi button state
    updateBuildMultiButton();
    
    // Don't load player stats until Generate is clicked
    // Hide player stats section
    playerStatsSection.style.display = 'none';
    
    // Reset recommendations and selected bets
    recommendations = [];
    selectedBets = [];
    hideRecommendations();
    hideSelectedBets();
}

// Populate lock dropdowns with players from selected team
async function populateLockDropdowns(teamName) {
    try {
        const response = await fetch(`${API_BASE_URL}/matchup-players?matchup=${encodeURIComponent(currentMatchup.matchup)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Filter players for the selected team
        const teamPlayers = data.filter(player => player.TeamName === teamName);
        matchupPlayers = teamPlayers;
        
        // Clear existing options
        sixLockSelect.innerHTML = '<option value="">Select a player...</option>';
        wicketLockSelect.innerHTML = '<option value="">Select a player...</option>';
        
        if (teamPlayers.length === 0) {
            // Add placeholder options if no players found
            sixLockSelect.innerHTML += '<option value="">No players found for this team</option>';
            wicketLockSelect.innerHTML += '<option value="">No players found for this team</option>';
        } else {
            // Populate both dropdowns with team players
            teamPlayers.forEach(player => {
                const sixOption = document.createElement('option');
                sixOption.value = player.PlayerName;
                sixOption.textContent = player.PlayerName;
                sixLockSelect.appendChild(sixOption);
                
                const wicketOption = document.createElement('option');
                wicketOption.value = player.PlayerName;
                wicketOption.textContent = player.PlayerName;
                wicketLockSelect.appendChild(wicketOption);
            });
        }
        
    } catch (error) {
        console.error('Error loading matchup players:', error);
        // Show error message in dropdowns
        sixLockSelect.innerHTML = '<option value="">Error loading players</option>';
        wicketLockSelect.innerHTML = '<option value="">Error loading players</option>';
    }
}

// Handle six lock selection
async function handleSixLockSelection() {
    const playerName = sixLockSelect.value;
    if (!playerName) {
        selectedSixLock = null;
        updateLockDisplay();
        updateBuildMultiButton();
        return;
    }
    
    try {
        // Get player batting stats
        const response = await fetch(`${API_BASE_URL}/player-stats/${encodeURIComponent(playerName)}`);
        const data = await response.json();
        
        if (data.batting_stats && data.batting_stats.six_hit_pct) {
            selectedSixLock = {
                name: playerName,
                market: 'Hit a Six',
                percentage: data.batting_stats.six_hit_pct
            };
        }
        
        updateLockDisplay();
        updateBuildMultiButton();
        
    } catch (error) {
        console.error('Error loading player stats:', error);
    }
}

// Handle wicket lock selection
async function handleWicketLockSelection() {
    const playerName = wicketLockSelect.value;
    if (!playerName) {
        selectedWicketLock = null;
        updateLockDisplay();
        updateBuildMultiButton();
        return;
    }
    
    try {
        // Get player bowling stats
        const response = await fetch(`${API_BASE_URL}/player-stats/${encodeURIComponent(playerName)}`);
        const data = await response.json();
        
        if (data.bowling_stats && data.bowling_stats.wicket_1_plus_pct) {
            selectedWicketLock = {
                name: playerName,
                market: '1+ Wickets',
                percentage: data.bowling_stats.wicket_1_plus_pct
            };
        }
        
        updateLockDisplay();
        updateBuildMultiButton();
        
    } catch (error) {
        console.error('Error loading player stats:', error);
    }
}

// Update lock selections display
function updateLockDisplay() {
    lockSelectionsDisplay.innerHTML = '';
    
    if (selectedSixLock || selectedWicketLock) {
        lockSelectionsDisplay.style.display = 'block';
        
        if (selectedSixLock) {
            const lockBox = document.createElement('div');
            lockBox.className = 'lock-player-box';
            lockBox.innerHTML = `
                <div class="lock-player-info">
                    <span class="lock-player-name">${selectedSixLock.name}</span>
                    <span class="lock-separator"> • </span>
                    <span class="lock-market-name">${selectedSixLock.market}</span>
                    <span class="lock-separator"> • </span>
                    <span class="lock-percentage">${selectedSixLock.percentage}</span>
                </div>
            `;
            lockSelectionsDisplay.appendChild(lockBox);
        }
        
        if (selectedWicketLock) {
            const lockBox = document.createElement('div');
            lockBox.className = 'lock-player-box';
            lockBox.innerHTML = `
                <div class="lock-player-info">
                    <span class="lock-player-name">${selectedWicketLock.name}</span>
                    <span class="lock-separator"> • </span>
                    <span class="lock-market-name">${selectedWicketLock.market}</span>
                    <span class="lock-separator"> • </span>
                    <span class="lock-percentage">${selectedWicketLock.percentage}</span>
                </div>
            `;
            lockSelectionsDisplay.appendChild(lockBox);
        }
    } else {
        lockSelectionsDisplay.style.display = 'none';
    }
}

// Update build multi button state
function updateBuildMultiButton() {
    const hasWinner = selectedWinner !== null;
    const hasSixLock = selectedSixLock !== null;
    const hasWicketLock = selectedWicketLock !== null;
    
    buildMultiBtn.disabled = !(hasWinner && hasSixLock && hasWicketLock);
}

// Handle build multi button click
async function handleBuildMulti() {
    if (!selectedWinner || !currentMatchup) return;
    
    try {
        buildMultiBtn.textContent = 'Loading...';
        buildMultiBtn.disabled = true;
        
        const response = await fetch(`${API_BASE_URL}/recommendations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                winner_team: selectedWinner,
                match_id: currentMatchup.matchup.replace(' vs ', '_vs_')
            })
        });
        
        const data = await response.json();
        recommendations = data.recommendations;
        
        // Show player stats after successful generation
        loadPlayerStats(selectedWinner);
        
    } catch (error) {
        console.error('Error getting recommendations:', error);
        alert('Error loading recommendations. Please try again.');
    } finally {
        buildMultiBtn.textContent = 'Generate';
        buildMultiBtn.disabled = false;
    }
}

// Removed displayRecommendations function as recommendations are now shown as stats

// Removed toggleRecommendation function as recommendations are now display-only

// Update selected bets display
function updateSelectedBets() {
    if (selectedBets.length === 0) {
        hideSelectedBets();
        return;
    }
    
    // Add winner selection to the display
    const allBets = [
        {
            player_name: selectedWinner,
            market: 'Match Winner',
            percentage: 'Selected',
            type: 'winner'
        },
        ...selectedBets
    ];
    
    selectedBetsList.innerHTML = '';
    
    allBets.forEach((bet, index) => {
        const item = document.createElement('div');
        item.className = 'selected-bet-item';
        
        if (bet.type === 'winner') {
            item.innerHTML = `
                <div class="selected-bet-details">
                    <div class="selected-bet-player">${bet.player_name}</div>
                    <div class="selected-bet-market">${bet.market}</div>
                </div>
                <div class="selected-bet-percentage">✓</div>
            `;
        } else {
            item.innerHTML = `
                <div class="selected-bet-details">
                    <div class="selected-bet-player">${bet.player_name}</div>
                    <div class="selected-bet-market">${bet.market}</div>
                </div>
                <div class="selected-bet-percentage">${bet.percentage}</div>
                <button class="remove-bet-btn" onclick="removeBet('${bet.id}')">×</button>
            `;
        }
        
        selectedBetsList.appendChild(item);
    });
    
    // Update leg count
    legCount.textContent = allBets.length;
    
    selectedBetsSection.style.display = 'block';
}

// Remove bet from selection
function removeBet(betId) {
    selectedBets = selectedBets.filter(bet => bet.id !== betId);
    
    // Uncheck the corresponding recommendation
    recommendations.forEach((rec, index) => {
        const checkbox = document.getElementById(`rec-${index}`);
        if (checkbox && selectedBets.find(bet => 
            bet.player_name === rec.player_name && bet.market === rec.market
        ) === undefined) {
            checkbox.checked = false;
        }
    });
    
    updateSelectedBets();
}

// Handle view bet slip
async function handleViewBetSlip() {
    if (selectedBets.length === 0) {
        alert('Please select at least one bet to continue.');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/build-multi`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                winner_team: selectedWinner,
                selected_bets: selectedBets
            })
        });
        
        const data = await response.json();
        
        // Show bet slip summary
        const summary = `
Multi Bet Summary:
- Winner: ${selectedWinner}
- Total Legs: ${data.multi_bet.total_legs}
- Combined Percentage: ${data.multi_bet.combined_percentage}
- Estimated Odds: ${data.multi_bet.estimated_odds}

Selected Bets:
${selectedBets.map(bet => `• ${bet.player_name} - ${bet.market} (${bet.percentage})`).join('\n')}
        `;
        
        alert(summary);
        
    } catch (error) {
        console.error('Error building multi:', error);
        alert('Error creating bet slip. Please try again.');
    }
}

// Load player stats for selected team
async function loadPlayerStats(teamName) {
    try {
        const response = await fetch(`${API_BASE_URL}/team-stats/${encodeURIComponent(teamName)}`);
        const data = await response.json();
        
        displayPlayerStats(data.players, teamName);
        
    } catch (error) {
        console.error('Error loading player stats:', error);
        playerStatsSection.style.display = 'none';
    }
}

// Display player stats
function displayPlayerStats(players, teamName) {
    if (!players || players.length === 0) {
        playerStatsSection.style.display = 'none';
        return;
    }
    
    // Store all players for reference
    allPlayers = players;
    
    // Update title
    const statsTitle = playerStatsSection.querySelector('.stats-title');
    statsTitle.textContent = 'Player Stats';
    
    // Clear previous content
    battingStatsList.innerHTML = '';
    bowlingStatsList.innerHTML = '';
    additionalRecommendationsList.innerHTML = '';
    
    // Separate players into batting and bowling
    const batters = players.filter(player => player.batting_stats && 
        (player.batting_stats.total_innings > 0 || player.batting_stats.total_runs > 0));
    const bowlers = players.filter(player => player.bowling_stats && 
        (player.bowling_stats.total_innings > 0 || player.bowling_stats.total_wickets > 0));
    
    // Sort batting stats by percentage of sixes hit (descending)
    const sortedBatters = batters
        .filter(player => player.batting_stats.six_hit_pct && player.batting_stats.six_hit_pct !== '0.0%')
        .sort((a, b) => {
            const aValue = parseFloat(a.batting_stats.six_hit_pct?.replace('%', '') || 0);
            const bValue = parseFloat(b.batting_stats.six_hit_pct?.replace('%', '') || 0);
            return bValue - aValue; // Descending order
        });
    
    // Create separate boxes for batting market (top 3)
    createBattingMarketBoxes(sortedBatters);
    
    // Sort bowling stats by percentage of 1+ wickets (descending)
    const sortedBowlers = bowlers
        .filter(player => player.bowling_stats.wicket_1_plus_pct && player.bowling_stats.wicket_1_plus_pct !== '0.0%')
        .sort((a, b) => {
            const aValue = parseFloat(a.bowling_stats.wicket_1_plus_pct?.replace('%', '') || 0);
            const bValue = parseFloat(b.bowling_stats.wicket_1_plus_pct?.replace('%', '') || 0);
            return bValue - aValue; // Descending order
        });
    
    // Create separate boxes for bowling market (top 3)
    createBowlingMarketBoxes(sortedBowlers);
    
    // Create Additional Recommendations section
    createAdditionalRecommendations(batters, bowlers);
    
    playerStatsSection.style.display = 'block';
}

// Create separate boxes for batting markets - only "Hit a Six"
function createBattingMarketBoxes(batters) {
    // Only show "Hit a Six" market for top 3 batters
    batters.slice(0, 3).forEach((player, playerIndex) => {
        const batting = player.batting_stats;
        const percentage = batting.six_hit_pct;
        
        if (percentage && percentage !== '0.0%') {
            const marketBox = createMarketBox(
                player, 
                'batting', 
                'Hit a Six', 
                percentage, 
                `batting-${playerIndex}-six_hit_pct`,
                true // Add checkbox for recommendations
            );
            battingStatsList.appendChild(marketBox);
        }
    });
}

// Create separate boxes for bowling markets - only "1+ Wickets"
function createBowlingMarketBoxes(bowlers) {
    // Only show "1+ Wickets" market for top 3 bowlers
    bowlers.slice(0, 3).forEach((player, playerIndex) => {
        const bowling = player.bowling_stats;
        const percentage = bowling.wicket_1_plus_pct;
        
        if (percentage && percentage !== '0.0%') {
            const marketBox = createMarketBox(
                player, 
                'bowling', 
                '1+ Wickets', 
                percentage, 
                `bowling-${playerIndex}-wicket_1_plus_pct`,
                true // Add checkbox for recommendations
            );
            bowlingStatsList.appendChild(marketBox);
        }
    });
}

// Create individual market box
function createMarketBox(player, type, marketName, percentage, boxId, showCheckbox = true) {
    const marketDiv = document.createElement('div');
    marketDiv.className = 'market-stat-box';
    
    const checkboxHtml = showCheckbox ? 
        `<input type="checkbox" class="market-checkbox" id="${boxId}" 
               onchange="toggleMarketSelection('${boxId}', '${player.name}', '${marketName}', '${percentage}')"/>` : '';
    
    marketDiv.innerHTML = `
        ${checkboxHtml}
        <div class="market-info">
            <span class="market-player-name">${player.name}</span>
            <span class="market-separator"> • </span>
            <span class="market-name">${marketName}</span>
            <span class="market-separator"> • </span>
            <span class="market-percentage">${percentage}</span>
        </div>
    `;
    
    return marketDiv;
}

// Create Additional Recommendations section
function createAdditionalRecommendations(batters, bowlers) {
    const additionalMarkets = [];
    
    // Get top 2 batting markets (excluding Hit a Six)
    const battingMarkets = [
        { key: 'runs_10_plus_pct', name: '10+ Runs', countKey: 'runs_10_plus_count' },
        { key: 'runs_20_plus_pct', name: '20+ Runs', countKey: 'runs_20_plus_count' },
        { key: 'top_scorer_pct', name: 'Top Team Run Scorer', countKey: 'top_scorer_count' }
    ];
    
    battingMarkets.forEach(market => {
        const topBatter = batters
            .filter(player => player.batting_stats[market.key] && player.batting_stats[market.key] !== '0.0%')
            .sort((a, b) => {
                const aValue = parseInt(a.batting_stats[market.countKey] || 0);
                const bValue = parseInt(b.batting_stats[market.countKey] || 0);
                return bValue - aValue;
            })[0];
        
        if (topBatter) {
            additionalMarkets.push({
                player: topBatter,
                type: 'batting',
                market: market.name,
                percentage: topBatter.batting_stats[market.key]
            });
        }
    });
    
    // Get top 2 bowling markets (excluding 1+ Wickets)
    const bowlingMarkets = [
        { key: 'wicket_2_plus_pct', name: '2+ Wickets', countKey: 'wicket_2_plus_count' },
        { key: 'top_wicket_taker_pct', name: 'Top Wicket Taker', countKey: 'top_wicket_taker_count' }
    ];
    
    bowlingMarkets.forEach(market => {
        const topBowler = bowlers
            .filter(player => player.bowling_stats[market.key] && player.bowling_stats[market.key] !== '0.0%')
            .sort((a, b) => {
                const aValue = parseInt(a.bowling_stats[market.countKey] || 0);
                const bValue = parseInt(b.bowling_stats[market.countKey] || 0);
                return bValue - aValue;
            })[0];
        
        if (topBowler) {
            additionalMarkets.push({
                player: topBowler,
                type: 'bowling',
                market: market.name,
                percentage: topBowler.bowling_stats[market.key]
            });
        }
    });
    
    // Display top 4 additional recommendations
    additionalMarkets.slice(0, 4).forEach((item, index) => {
        const marketBox = createMarketBox(
            item.player,
            item.type,
            item.market,
            item.percentage,
            `additional-${index}-${item.market.replace(/\s+/g, '-').toLowerCase()}`,
            true // Add checkbox for additional recommendations
        );
        additionalRecommendationsList.appendChild(marketBox);
    });
    
    // Show additional recommendations section
    document.getElementById('additionalRecommendationsSection').style.display = 'block';
}

// Toggle market selection
function toggleMarketSelection(boxId, playerName, marketName, percentage) {
    const checkbox = document.getElementById(boxId);
    const marketBox = checkbox.closest('.market-stat-box');
    
    if (checkbox.checked) {
        // Add to selected players
        const selection = {
            id: boxId,
            name: playerName,
            market: marketName,
            percentage: percentage
        };
        
        selectedPlayers.push(selection);
        marketBox.classList.add('selected');
    } else {
        // Remove from selected players
        selectedPlayers = selectedPlayers.filter(p => p.id !== boxId);
        marketBox.classList.remove('selected');
    }
    
    updateAdditionalSelections();
}

// Update selectable recommendations display
function updateAdditionalSelections() {
    if (selectedPlayers.length === 0) {
        selectableRecommendationsSection.style.display = 'none';
        return;
    }
    
    selectableRecommendationsList.innerHTML = '';
    
    selectedPlayers.forEach(player => {
        const selectionDiv = document.createElement('div');
        selectionDiv.className = 'selectable-recommendation-item';
        
        selectionDiv.innerHTML = `
            <div class="selection-player-info">
                <div class="selection-player-name">${player.name}</div>
                <div class="selection-player-stat">${player.market} (${player.percentage})</div>
            </div>
            <button class="selection-remove-btn" onclick="removePlayerSelection('${player.id}')">
                ×
            </button>
        `;
        
        selectableRecommendationsList.appendChild(selectionDiv);
    });
    
    selectableRecommendationsSection.style.display = 'block';
}

// Remove player selection
function removePlayerSelection(playerId) {
    // Uncheck the checkbox
    const checkbox = document.getElementById(playerId);
    if (checkbox) {
        checkbox.checked = false;
        checkbox.closest('.market-stat-box').classList.remove('selected');
    }
    
    // Remove from selected players
    selectedPlayers = selectedPlayers.filter(p => p.id !== playerId);
    
    updateAdditionalSelections();
}

// Helper functions
function resetSelections() {
    selectedWinner = null;
    recommendations = [];
    selectedBets = [];
    selectedPlayers = [];
    allPlayers = [];
    
    team1Btn.classList.remove('selected');
    team2Btn.classList.remove('selected');
    buildMultiBtn.disabled = true;
    
    hideRecommendations();
    hideSelectedBets();
    hidePlayerStats();
    hideAdditionalSelections();
}

function hideAdditionalSelections() {
    selectableRecommendationsSection.style.display = 'none';
    document.getElementById('additionalRecommendationsSection').style.display = 'none';
}

function hidePlayerStats() {
    playerStatsSection.style.display = 'none';
}

function hideRecommendations() {
    // No longer needed as recommendationsSection was removed
}

function hideSelectedBets() {
    selectedBetsSection.style.display = 'none';
}

// Make functions globally available
window.removeBet = removeBet;
window.toggleMarketSelection = toggleMarketSelection;
window.removePlayerSelection = removePlayerSelection;
