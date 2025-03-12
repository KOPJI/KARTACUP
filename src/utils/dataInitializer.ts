import { Team, Match, Group } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { saveMatch, saveTeam } from './firebase';

const initialGroups: Group[] = [
  {
    name: 'A',
    teams: ['REMAJA PUTRA A', 'PALAPA A', 'TOXNET A', 'PERU FC B', 'LEMKA B', 'PORBA JAYA A']
  },
  {
    name: 'B',
    teams: ['DL GUNS', 'TOXNET B', 'PORBA JAYA B', 'PUTRA MANDIRI B', 'REMAJA PUTRA B']
  },
  {
    name: 'C',
    teams: ['GANESA A', 'REMAJA PUTRA C', 'PERU FC C', 'PERKID FC', 'PUTRA MANDIRI A']
  },
  {
    name: 'D',
    teams: ['LEMKA A', 'BALPAS FC', 'ARUMBA FC', 'GANESA B', 'PERU FC A', 'PELANA FC']
  }
];

// Jadwal pertandingan tetap
const matchTimeSlots = [
  { start: '13:30', end: '14:35' },
  { start: '14:45', end: '15:50' },
  { start: '16:00', end: '17:05' }
];

// Helper function to generate unique ID
export const generateId = (): string => {
  return uuidv4();
};

// Format tanggal ke dd/mm/yyyy
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

// Parse tanggal dari dd/mm/yyyy ke yyyy-mm-dd
export const parseDate = (dateString: string): string => {
  if (!dateString) return '';
  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`;
};

// Fungsi untuk mendapatkan tanggal berikutnya
const getNextDate = (date: Date): Date => {
  const nextDate = new Date(date);
  nextDate.setDate(date.getDate() + 1);
  return nextDate;
};

// Format tanggal ke YYYY-MM-DD
const formatDateISOString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const initializeData = () => {
  // Cek apakah data sudah ada di localStorage
  if (!localStorage.getItem('teams')) {
    // Inisialisasi tim
    const teams: Team[] = [];
    
    initialGroups.forEach(group => {
      group.teams.forEach(teamName => {
        teams.push({
          id: generateId(),
          name: teamName,
          group: group.name,
          players: [],
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0
        });
      });
    });
    
    localStorage.setItem('teams', JSON.stringify(teams));
    localStorage.setItem('groups', JSON.stringify(initialGroups));
    localStorage.setItem('matches', JSON.stringify([]));
  }
};

export const clearData = () => {
  localStorage.removeItem('teams');
  localStorage.removeItem('matches');
  localStorage.removeItem('groups');
};

export const generateSchedule = (startDate?: string, teamsData?: Team[]) => {
  // Use provided teams data or get from localStorage if not provided
  const teams = teamsData || JSON.parse(localStorage.getItem('teams') || '[]') as Team[];
  
  if (!teams || teams.length === 0) {
    console.error("No teams data available for schedule generation");
    return [];
  }
  
  // Jika tidak ada startDate, gunakan tanggal hari ini
  const tournamentStartDate = startDate 
    ? new Date(startDate) 
    : new Date();
  
  let currentDate = new Date(tournamentStartDate);
  
  const matches: Match[] = [];
  const groups: { [key: string]: Team[] } = {};
  
  // Kelompokkan tim berdasarkan grup
  teams.forEach(team => {
    if (!groups[team.group]) {
      groups[team.group] = [];
    }
    groups[team.group].push(team);
  });
  
  // Objek untuk melacak terakhir kali tim bermain
  const lastMatchDate: { [teamId: string]: Date } = {};
  teams.forEach(team => {
    lastMatchDate[team.id] = new Date(0); // Set ke tanggal lampau
  });
  
  // Objek untuk melacak jadwal pertandingan per hari
  interface DailySchedule {
    [date: string]: {
      matches: Array<{homeTeamId: string, awayTeamId: string, group: string}>;
      slots: boolean[];
    }
  }
  
  const dailySchedule: DailySchedule = {};
  
  // Fungsi untuk menambahkan pertandingan ke jadwal harian
  const addToSchedule = (match: {homeTeamId: string, awayTeamId: string, group: string}, date: Date) => {
    const dateStr = formatDateISOString(date);
    
    if (!dailySchedule[dateStr]) {
      dailySchedule[dateStr] = {
        matches: [],
        slots: [false, false, false] // 3 slot pertandingan per hari
      };
    }
    
    // Cek apakah masih ada slot tersedia
    const availableSlot = dailySchedule[dateStr].slots.findIndex(slot => !slot);
    if (availableSlot === -1) {
      return false; // Tidak ada slot tersedia
    }
    
    // Tambahkan pertandingan ke slot yang tersedia
    dailySchedule[dateStr].matches.push(match);
    dailySchedule[dateStr].slots[availableSlot] = true;
    
    // Update tanggal terakhir bermain untuk kedua tim
    lastMatchDate[match.homeTeamId] = date;
    lastMatchDate[match.awayTeamId] = date;
    
    return true;
  };
  
  // Buat jadwal round-robin untuk setiap grup dengan istirahat yang seimbang
  const groupOrder = Object.keys(groups);
  const allPairings: Array<{homeTeamId: string, awayTeamId: string, group: string}> = [];
  
  // Kumpulkan semua pasangan pertandingan dari semua grup
  groupOrder.forEach(groupName => {
    const groupTeams = groups[groupName];
    
    // Verify that we have enough teams in this group
    if (!groupTeams || groupTeams.length < 2) {
      console.warn(`Group ${groupName} has less than 2 teams, skipping`);
      return;
    }
    
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        allPairings.push({
          homeTeamId: groupTeams[i].id,
          awayTeamId: groupTeams[j].id,
          group: groupName
        });
      }
    }
  });
  
  // If no pairings were created, return an empty array
  if (allPairings.length === 0) {
    console.error("No match pairings could be created");
    return [];
  }
  
  // Acak pasangan pertandingan untuk distribusi yang merata
  allPairings.sort(() => Math.random() - 0.5);
  
  // Jadwalkan semua pertandingan
  let matchesScheduled = 0;
  const totalMatches = allPairings.length;
  let maxIterations = totalMatches * 7; // Prevent infinite loops
  let iterationCount = 0;
  
  while (matchesScheduled < totalMatches && iterationCount < maxIterations) {
    iterationCount++;
    let matchAdded = false;
    
    for (const pairing of allPairings) {
      // Skip if either team ID is invalid
      if (!pairing.homeTeamId || !pairing.awayTeamId) {
        continue;
      }
      
      // Lewati pertandingan yang sudah dijadwalkan
      if (matches.some(m => 
        (m.homeTeamId === pairing.homeTeamId && m.awayTeamId === pairing.awayTeamId) || 
        (m.homeTeamId === pairing.awayTeamId && m.awayTeamId === pairing.homeTeamId)
      )) {
        continue;
      }
      
      // Cek apakah kedua tim memiliki istirahat yang cukup (minimal 1 hari)
      const homeTeamLastMatch = lastMatchDate[pairing.homeTeamId];
      const awayTeamLastMatch = lastMatchDate[pairing.awayTeamId];
      
      // Skip if we don't have last match dates for these teams
      if (!homeTeamLastMatch || !awayTeamLastMatch) {
        continue;
      }
      
      const minRestDays = 1; // Minimal 1 hari istirahat
      
      const homeTeamRestDays = Math.floor((currentDate.getTime() - homeTeamLastMatch.getTime()) / (1000 * 60 * 60 * 24));
      const awayTeamRestDays = Math.floor((currentDate.getTime() - awayTeamLastMatch.getTime()) / (1000 * 60 * 60 * 24));
      
      if (homeTeamRestDays < minRestDays || awayTeamRestDays < minRestDays) {
        continue;
      }
      
      // Coba tambahkan ke jadwal
      if (addToSchedule(pairing, currentDate)) {
        matchAdded = true;
        
        // Tambahkan ke daftar pertandingan
        const dateStr = formatDateISOString(currentDate);
        const scheduleForDate = dailySchedule[dateStr];
        
        if (!scheduleForDate) {
          console.error(`No schedule found for date ${dateStr}`);
          continue;
        }
        
        // Find which slot this match was added to
        const slotIndex = scheduleForDate.slots.findIndex((slot, idx) => 
          slot === true && 
          idx < scheduleForDate.matches.length && 
          scheduleForDate.matches[idx] && 
          scheduleForDate.matches[idx].homeTeamId === pairing.homeTeamId && 
          scheduleForDate.matches[idx].awayTeamId === pairing.awayTeamId
        );
        
        if (slotIndex === -1) {
          console.error("Could not determine slot index for match");
          continue;
        }
        
        matches.push({
          id: generateId(),
          homeTeamId: pairing.homeTeamId,
          awayTeamId: pairing.awayTeamId,
          homeScore: null,
          awayScore: null,
          date: dateStr,
          time: matchTimeSlots[slotIndex]?.start || "13:30",
          venue: "Lapangan Gelora Babakan Girihieum",
          group: pairing.group,
          status: 'scheduled',
          scorers: [],
          cards: []
        });
        
        matchesScheduled++;
      }
    }
    
    // Check if we've added any matches on this day
    if (!matchAdded) {
      // No matches added, move to next day
      currentDate = getNextDate(currentDate);
    } else {
      // Check if all slots for today are filled
      const dateStr = formatDateISOString(currentDate);
      if (dailySchedule[dateStr] && dailySchedule[dateStr].slots.every(slot => slot)) {
        // All slots filled, move to next day
        currentDate = getNextDate(currentDate);
      }
    }
  }
  
  if (matchesScheduled < totalMatches) {
    console.warn(`Could only schedule ${matchesScheduled} out of ${totalMatches} matches`);
  }
  
  // Simpan jadwal yang sudah dibuat
  localStorage.setItem('matches', JSON.stringify(matches));
  return matches;
};

export const getTeamById = (id: string): Team | undefined => {
  const teams = JSON.parse(localStorage.getItem('teams') || '[]') as Team[];
  return teams.find(team => team.id === id);
};

export const getTeamsByGroup = (group: string): Team[] => {
  const teams = JSON.parse(localStorage.getItem('teams') || '[]') as Team[];
  return teams.filter(team => team.group === group);
};

export const updateMatch = (match: Match) => {
  const matches = JSON.parse(localStorage.getItem('matches') || '[]') as Match[];
  const index = matches.findIndex(m => m.id === match.id);
  
  if (index !== -1) {
    const oldMatch = matches[index];
    matches[index] = match;
    localStorage.setItem('matches', JSON.stringify(matches));
    
    // Jika status pertandingan berubah dari 'scheduled' ke 'completed'
    // atau jika skor pertandingan berubah, perbarui klasemen
    if (
      (oldMatch.status !== 'completed' && match.status === 'completed') ||
      (oldMatch.homeScore !== match.homeScore || oldMatch.awayScore !== match.awayScore)
    ) {
      updateStandings();
      updatePlayerStats(match);
    }
  }
  
  // Save to Firestore
  saveMatch(match);
};

export const updateStandings = () => {
  const teams = JSON.parse(localStorage.getItem('teams') || '[]') as Team[];
  const matches = JSON.parse(localStorage.getItem('matches') || '[]') as Match[];
  
  // Reset semua statistik tim
  teams.forEach(team => {
    team.played = 0;
    team.won = 0;
    team.drawn = 0;
    team.lost = 0;
    team.goalsFor = 0;
    team.goalsAgainst = 0;
    team.points = 0;
  });
  
  // Hitung statistik berdasarkan pertandingan yang sudah selesai
  matches
    .filter(match => match.status === 'completed' && match.homeScore !== null && match.awayScore !== null)
    .forEach(match => {
      const homeTeam = teams.find(team => team.id === match.homeTeamId);
      const awayTeam = teams.find(team => team.id === match.awayTeamId);
      
      if (homeTeam && awayTeam) {
        // Update statistik tim tuan rumah
        homeTeam.played += 1;
        homeTeam.goalsFor += match.homeScore!;
        homeTeam.goalsAgainst += match.awayScore!;
        
        // Update statistik tim tamu
        awayTeam.played += 1;
        awayTeam.goalsFor += match.awayScore!;
        awayTeam.goalsAgainst += match.homeScore!;
        
        // Update W/D/L dan poin
        if (match.homeScore! > match.awayScore!) {
          homeTeam.won += 1;
          homeTeam.points += 3;
          awayTeam.lost += 1;
        } else if (match.homeScore! < match.awayScore!) {
          awayTeam.won += 1;
          awayTeam.points += 3;
          homeTeam.lost += 1;
        } else {
          homeTeam.drawn += 1;
          homeTeam.points += 1;
          awayTeam.drawn += 1;
          awayTeam.points += 1;
        }
      }
    });
  
  // Save teams to localStorage and Firestore
  localStorage.setItem('teams', JSON.stringify(teams));
  teams.forEach(team => saveTeam(team));
};

export const updatePlayerStats = (match: Match) => {
  if (match.status !== 'completed') return;
  
  const teams = JSON.parse(localStorage.getItem('teams') || '[]') as Team[];
  
  // Reset gol dan kartu untuk semua pemain dalam pertandingan ini
  const resetStats = (teamId: string, matchId: string) => {
    const teamIndex = teams.findIndex(t => t.id === teamId);
    if (teamIndex === -1) return;
    
    // Hapus gol yang terkait dengan pertandingan ini
    const allMatches = JSON.parse(localStorage.getItem('matches') || '[]') as Match[];
    const otherMatches = allMatches.filter(m => m.id !== matchId);
    
    teams[teamIndex].players = teams[teamIndex].players.map(player => {
      // Hitung ulang gol dari pertandingan lain
      const goalsInOtherMatches = otherMatches.flatMap(m => 
        m.scorers.filter(s => s.playerId === player.id && s.teamId === teamId)
      ).length;
      
      // Hitung ulang kartu dari pertandingan lain
      const yellowCardsInOtherMatches = otherMatches.flatMap(m => 
        m.cards.filter(c => c.playerId === player.id && c.teamId === teamId && c.type === 'yellow')
      ).length;
      
      const redCardsInOtherMatches = otherMatches.flatMap(m => 
        m.cards.filter(c => c.playerId === player.id && c.teamId === teamId && c.type === 'red')
      ).length;
      
      return {
        ...player,
        goals: goalsInOtherMatches,
        yellowCards: yellowCardsInOtherMatches,
        redCards: redCardsInOtherMatches,
        // Pemain dilarang bermain jika memiliki kartu merah atau 2+ kartu kuning
        isBanned: redCardsInOtherMatches > 0 || yellowCardsInOtherMatches >= 2
      };
    });
  };
  
  // Reset statistik untuk kedua tim
  resetStats(match.homeTeamId, match.id);
  resetStats(match.awayTeamId, match.id);
  
  // Tambahkan gol dari pertandingan ini
  match.scorers.forEach(scorer => {
    const teamIndex = teams.findIndex(t => t.id === scorer.teamId);
    if (teamIndex === -1) return;
    
    const playerIndex = teams[teamIndex].players.findIndex(p => p.id === scorer.playerId);
    if (playerIndex === -1) return;
    
    teams[teamIndex].players[playerIndex].goals += 1;
  });
  
  // Tambahkan kartu dari pertandingan ini
  match.cards.forEach(card => {
    const teamIndex = teams.findIndex(t => t.id === card.teamId);
    if (teamIndex === -1) return;
    
    const playerIndex = teams[teamIndex].players.findIndex(p => p.id === card.playerId);
    if (playerIndex === -1) return;
    
    if (card.type === 'yellow') {
      teams[teamIndex].players[playerIndex].yellowCards += 1;
    } else {
      teams[teamIndex].players[playerIndex].redCards += 1;
    }
    
    // Update status larangan bermain
    const player = teams[teamIndex].players[playerIndex];
    teams[teamIndex].players[playerIndex].isBanned = 
      player.redCards > 0 || player.yellowCards >= 2;
  });
  
  localStorage.setItem('teams', JSON.stringify(teams));
  teams.forEach(team => saveTeam(team));
};

export const getPlayerBanStatus = (playerId: string, teamId: string): boolean => {
  const teams = JSON.parse(localStorage.getItem('teams') || '[]') as Team[];
  const team = teams.find(t => t.id === teamId);
  if (!team) return false;
  
  const player = team.players.find(p => p.id === playerId);
  return player ? player.isBanned : false;
};

export const resetPlayerBan = (playerId: string, teamId: string): void => {
  const teams = JSON.parse(localStorage.getItem('teams') || '[]') as Team[];
  const teamIndex = teams.findIndex(t => t.id === teamId);
  if (teamIndex === -1) return;
  
  const playerIndex = teams[teamIndex].players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return;
  
  // Reset kartu kuning pemain setelah menjalani hukuman
  teams[teamIndex].players[playerIndex].yellowCards = 0;
  teams[teamIndex].players[playerIndex].isBanned = 
    teams[teamIndex].players[playerIndex].redCards > 0;
  
  localStorage.setItem('teams', JSON.stringify(teams));
  saveTeam(teams[teamIndex]);
};
