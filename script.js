// BBL Multi Builder JavaScript
const API_BASE_URL = 'http://localhost:8000';

// Global state
let currentMatch = null;
let selectedWinner = null;
let recommendations = [];
let selectedBets = [];

// DOM elements
const matchSelect = document.getElementById('matchSelect');
const homeTeamBtn = document.getElementById('homeTeamBtn');
const awayTeamBtn = document.getElementById('awayTeamBtn');
const buildMultiBtn = document.getElementById('buildMultiBtn');
const recommendationsSection = document.getElementById('recommendationsSection');
const recommendationsList = document.getElementById('recommendationsList');
const selectedBetsSection = document.getElementById('selectedBets');
const selectedBetsList = document.getElementById('selectedBetsList');
const viewBetSlipBtn = document.getElementById('viewBetSlipBtn');
const legCount = document.getElementById('legCount');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadMatches();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    matchSelect.addEventListener('change', handleMatchSelection);
    homeTeamBtn.addEventListener('click', () => selectWinner('home'));
    awayTeamBtn.addEventListener('click', () => selectWinner('away'));
    buildMultiBtn.addEventListener('click', handleBuildMulti);
    viewBetSlipBtn.addEventListener('click', handleViewBetSlip);
}

// Load available matches
async function loadMatches() {
    try {
        const response = await fetch(`${API_BASE_URL}/matches`);
        const data = await response.json();
        
        matchSelect.innerHTML = '<option value="">Select a match...</option>';
        
        data.matches.forEach(match => {
            const option = document.createElement('option');
            option.value = match.id;
            option.textContent = match.display_name;
            option.dataset.homeTeam = match.home_team;
            option.dataset.awayTeam = match.away_team;
            matchSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading matches:', error);
        matchSelect.innerHTML = '<option value="">Error loading matches</option>';
    }
}

// Handle match selection
function handleMatchSelection() {
    const selectedOption = matchSelect.options[matchSelect.selectedIndex];
    
    if (selectedOption.value) {
        currentMatch = {
            id: selectedOption.value,
            homeTeam: selectedOption.dataset.homeTeam,
            awayTeam: selectedOption.dataset.awayTeam
        };
        
        // Update team buttons
        homeTeamBtn.querySelector('.team-name').textContent = currentMatch.homeTeam;
        awayTeamBtn.querySelector('.team-name').textContent = currentMatch.awayTeam;
        
        // Enable team buttons
        homeTeamBtn.disabled = false;
        awayTeamBtn.disabled = false;
        
        // Reset selections
        resetSelections();
    } else {
        currentMatch = null;
        homeTeamBtn.disabled = true;
        awayTeamBtn.disabled = true;
        homeTeamBtn.querySelector('.team-name').textContent = 'Select Match First';
        awayTeamBtn.querySelector('.team-name').textContent = 'Select Match First';
        resetSelections();
    }
}

// Select winner team
function selectWinner(team) {
    if (!currentMatch) return;
    
    selectedWinner = team === 'home' ? currentMatch.homeTeam : currentMatch.awayTeam;
    
    // Update button states
    homeTeamBtn.classList.toggle('selected', team === 'home');
    awayTeamBtn.classList.toggle('selected', team === 'away');
    
    // Enable build multi button
    buildMultiBtn.disabled = false;
    
    // Reset recommendations and selected bets
    recommendations = [];
    selectedBets = [];
    hideRecommendations();
    hideSelectedBets();
}

// Handle build multi button click
async function handleBuildMulti() {
    if (!selectedWinner || !currentMatch) return;
    
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
                match_id: currentMatch.id
            })
        });
        
        const data = await response.json();
        recommendations = data.recommendations;
        
        displayRecommendations();
        
    } catch (error) {
        console.error('Error getting recommendations:', error);
        alert('Error loading recommendations. Please try again.');
    } finally {
        buildMultiBtn.textContent = 'Build Multi';
        buildMultiBtn.disabled = false;
    }
}

// Display recommendations
function displayRecommendations() {
    if (recommendations.length === 0) {
        recommendationsList.innerHTML = '<div class="loading">No recommendations available</div>';
        recommendationsSection.style.display = 'block';
        return;
    }
    
    recommendationsList.innerHTML = '';
    
    recommendations.forEach((rec, index) => {
        const item = document.createElement('div');
        item.className = 'recommendation-item';
        item.innerHTML = `
            <input type="checkbox" id="rec-${index}" onchange="toggleRecommendation(${index})">
            <div class="recommendation-content">
                <div class="recommendation-player">${rec.player_name}</div>
                <div class="recommendation-market">${rec.market}</div>
            </div>
            <div class="recommendation-percentage">${rec.percentage}</div>
        `;
        
        recommendationsList.appendChild(item);
    });
    
    recommendationsSection.style.display = 'block';
}

// Toggle recommendation selection
function toggleRecommendation(index) {
    const checkbox = document.getElementById(`rec-${index}`);
    const recommendation = recommendations[index];
    
    if (checkbox.checked) {
        // Add to selected bets
        selectedBets.push({
            ...recommendation,
            id: `bet-${Date.now()}-${index}`
        });
    } else {
        // Remove from selected bets
        selectedBets = selectedBets.filter(bet => 
            bet.player_name !== recommendation.player_name || 
            bet.market !== recommendation.market
        );
    }
    
    updateSelectedBets();
}

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

// Helper functions
function resetSelections() {
    selectedWinner = null;
    recommendations = [];
    selectedBets = [];
    
    homeTeamBtn.classList.remove('selected');
    awayTeamBtn.classList.remove('selected');
    buildMultiBtn.disabled = true;
    
    hideRecommendations();
    hideSelectedBets();
}

function hideRecommendations() {
    recommendationsSection.style.display = 'none';
}

function hideSelectedBets() {
    selectedBetsSection.style.display = 'none';
}

// Make functions globally available
window.toggleRecommendation = toggleRecommendation;
window.removeBet = removeBet;
