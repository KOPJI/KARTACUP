import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, getDocs, getDoc, deleteDoc, query, where, addDoc, updateDoc, writeBatch } from "firebase/firestore";
import { Team, Match, Player, GoalScorer, Card, Group } from "../types";
import { generateId } from "./dataInitializer";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Format tanggal ke dd/mm/yyyy
export const formatDateToIndonesian = (dateString: string): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

// Parse tanggal dari dd/mm/yyyy ke yyyy-mm-dd
export const parseIndonesianDate = (dateString: string): string => {
  if (!dateString) return '';
  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`;
};

// Teams
export const getTeams = async (): Promise<Team[]> => {
  try {
    const teamsSnapshot = await getDocs(collection(db, "teams"));
    const teams: Team[] = [];
    teamsSnapshot.forEach((doc) => {
      teams.push(doc.data() as Team);
    });
    return teams;
  } catch (error) {
    console.error("Error getting teams:", error);
    // Fall back to localStorage if needed
    return JSON.parse(localStorage.getItem('teams') || '[]');
  }
};

export const getTeamById = async (id: string): Promise<Team | undefined> => {
  try {
    const docRef = doc(db, "teams", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as Team;
    } else {
      return undefined;
    }
  } catch (error) {
    console.error("Error getting team:", error);
    // Fall back to localStorage
    const teams = JSON.parse(localStorage.getItem('teams') || '[]') as Team[];
    return teams.find(team => team.id === id);
  }
};

export const saveTeam = async (team: Team): Promise<void> => {
  try {
    await setDoc(doc(db, "teams", team.id), team);
  } catch (error) {
    console.error("Error saving team:", error);
    // Fall back to localStorage
    const teams = JSON.parse(localStorage.getItem('teams') || '[]') as Team[];
    const index = teams.findIndex(t => t.id === team.id);
    if (index !== -1) {
      teams[index] = team;
    } else {
      teams.push(team);
    }
    localStorage.setItem('teams', JSON.stringify(teams));
  }
};

// Matches
export const getMatches = async (): Promise<Match[]> => {
  try {
    const matchesSnapshot = await getDocs(collection(db, "matches"));
    const matches: Match[] = [];
    matchesSnapshot.forEach((doc) => {
      matches.push(doc.data() as Match);
    });
    return matches;
  } catch (error) {
    console.error("Error getting matches:", error);
    // Fall back to localStorage
    return JSON.parse(localStorage.getItem('matches') || '[]');
  }
};

export const getMatchById = async (id: string): Promise<Match | undefined> => {
  try {
    const docRef = doc(db, "matches", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as Match;
    } else {
      return undefined;
    }
  } catch (error) {
    console.error("Error getting match:", error);
    // Fall back to localStorage
    const matches = JSON.parse(localStorage.getItem('matches') || '[]') as Match[];
    return matches.find(match => match.id === id);
  }
};

export const saveMatch = async (match: Match): Promise<void> => {
  try {
    await setDoc(doc(db, "matches", match.id), match);
  } catch (error) {
    console.error("Error saving match:", error);
    // Fall back to localStorage
    const matches = JSON.parse(localStorage.getItem('matches') || '[]') as Match[];
    const index = matches.findIndex(m => m.id === match.id);
    if (index !== -1) {
      matches[index] = match;
    } else {
      matches.push(match);
    }
    localStorage.setItem('matches', JSON.stringify(matches));
  }
};

export const deleteMatch = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "matches", id));
  } catch (error) {
    console.error("Error deleting match:", error);
    // Fall back to localStorage
    const matches = JSON.parse(localStorage.getItem('matches') || '[]') as Match[];
    const updatedMatches = matches.filter(m => m.id !== id);
    localStorage.setItem('matches', JSON.stringify(updatedMatches));
  }
};

export const deleteAllMatches = async (): Promise<void> => {
  try {
    // Get all matches
    const matchesSnapshot = await getDocs(collection(db, "matches"));
    
    // Use batch delete for better performance
    const batch = writeBatch(db);
    
    // Add delete operations to batch
    matchesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Execute batch
    await batch.commit();
    
    console.log("All matches deleted successfully");
    
    // Also delete related data in other collections
    // Delete all goals
    const goalsSnapshot = await getDocs(collection(db, "goals"));
    if (goalsSnapshot.size > 0) {
      const goalsBatch = writeBatch(db);
      goalsSnapshot.forEach((doc) => {
        goalsBatch.delete(doc.ref);
      });
      await goalsBatch.commit();
    }
    
    // Delete all yellow cards
    const yellowCardsSnapshot = await getDocs(collection(db, "card_yellow"));
    if (yellowCardsSnapshot.size > 0) {
      const yellowCardsBatch = writeBatch(db);
      yellowCardsSnapshot.forEach((doc) => {
        yellowCardsBatch.delete(doc.ref);
      });
      await yellowCardsBatch.commit();
    }
    
    // Delete all red cards
    const redCardsSnapshot = await getDocs(collection(db, "card_red"));
    if (redCardsSnapshot.size > 0) {
      const redCardsBatch = writeBatch(db);
      redCardsSnapshot.forEach((doc) => {
        redCardsBatch.delete(doc.ref);
      });
      await redCardsBatch.commit();
    }
    
    // Delete all card accumulation
    const accumulationSnapshot = await getDocs(collection(db, "card_accumulation"));
    if (accumulationSnapshot.size > 0) {
      const accumulationBatch = writeBatch(db);
      accumulationSnapshot.forEach((doc) => {
        accumulationBatch.delete(doc.ref);
      });
      await accumulationBatch.commit();
    }
    
    // Reset team statistics
    const teamsSnapshot = await getDocs(collection(db, "teams"));
    if (teamsSnapshot.size > 0) {
      const teamsBatch = writeBatch(db);
      teamsSnapshot.forEach((docSnapshot) => {
        const team = docSnapshot.data() as Team;
        
        // Reset team stats - FIX: Add check for undefined players
        const updatedTeam = {
          ...team,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
          players: Array.isArray(team.players) ? team.players.map(player => ({
            ...player,
            goals: 0,
            yellowCards: 0,
            redCards: 0,
            isBanned: false
          })) : []
        };
        
        teamsBatch.set(docSnapshot.ref, updatedTeam);
      });
      await teamsBatch.commit();
    }
    
    // Clear localStorage as well
    localStorage.setItem('matches', JSON.stringify([]));
    
  } catch (error) {
    console.error("Error deleting all matches:", error);
    throw error;
  }
};

// Goals
export const saveGoal = async (goal: GoalScorer): Promise<void> => {
  try {
    await setDoc(doc(db, "goals", goal.id), goal);
  } catch (error) {
    console.error("Error saving goal:", error);
    // No localStorage fallback needed as goals are stored within matches
  }
};

export const deleteGoal = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "goals", id));
  } catch (error) {
    console.error("Error deleting goal:", error);
  }
};

// Cards
export const saveCard = async (card: Card): Promise<void> => {
  try {
    // Save to appropriate collection based on card type
    const collectionName = card.type === 'yellow' ? 'card_yellow' : 'card_red';
    await setDoc(doc(db, collectionName, card.id), card);
    
    // Check for accumulation
    if (card.type === 'yellow') {
      const playerId = card.playerId;
      const teamId = card.teamId;
      
      // Count yellow cards for this player
      const yellowCardsQuery = query(
        collection(db, "card_yellow"), 
        where("playerId", "==", playerId),
        where("teamId", "==", teamId)
      );
      
      const yellowCardsSnapshot = await getDocs(yellowCardsQuery);
      const yellowCardCount = yellowCardsSnapshot.size;
      
      // If 2+ yellow cards, add to accumulation
      if (yellowCardCount >= 2) {
        await addDoc(collection(db, "card_accumulation"), {
          id: generateId(),
          playerId,
          teamId,
          reason: "Akumulasi 2 Kartu Kuning",
          date: new Date().toISOString()
        });
        
        // Update player ban status
        const teamDoc = await getDoc(doc(db, "teams", teamId));
        if (teamDoc.exists()) {
          const team = teamDoc.data() as Team;
          const updatedPlayers = team.players.map(player => {
            if (player.id === playerId) {
              return { ...player, isBanned: true };
            }
            return player;
          });
          
          await updateDoc(doc(db, "teams", teamId), {
            players: updatedPlayers
          });
        }
      }
    } else if (card.type === 'red') {
      // Add to accumulation for red card
      await addDoc(collection(db, "card_accumulation"), {
        id: generateId(),
        playerId: card.playerId,
        teamId: card.teamId,
        reason: "Kartu Merah Langsung",
        date: new Date().toISOString()
      });
      
      // Update player ban status
      const teamDoc = await getDoc(doc(db, "teams", card.teamId));
      if (teamDoc.exists()) {
        const team = teamDoc.data() as Team;
        const updatedPlayers = team.players.map(player => {
          if (player.id === card.playerId) {
            return { ...player, isBanned: true };
          }
          return player;
        });
        
        await updateDoc(doc(db, "teams", card.teamId), {
          players: updatedPlayers
        });
      }
    }
  } catch (error) {
    console.error("Error saving card:", error);
  }
};

export const deleteCard = async (card: Card): Promise<void> => {
  try {
    const collectionName = card.type === 'yellow' ? 'card_yellow' : 'card_red';
    await deleteDoc(doc(db, collectionName, card.id));
  } catch (error) {
    console.error("Error deleting card:", error);
  }
};

// Players
export const getPlayers = async (teamId: string): Promise<Player[]> => {
  try {
    const team = await getTeamById(teamId);
    return team?.players || [];
  } catch (error) {
    console.error("Error getting players:", error);
    return [];
  }
};

// Groups
export const getGroups = async (): Promise<Group[]> => {
  try {
    const groupsSnapshot = await getDocs(collection(db, "groups"));
    const groups: Group[] = [];
    groupsSnapshot.forEach((doc) => {
      groups.push(doc.data() as Group);
    });
    return groups;
  } catch (error) {
    console.error("Error getting groups:", error);
    return JSON.parse(localStorage.getItem('groups') || '[]');
  }
};

// Initialize Data
export const initializeTeamsData = async (): Promise<void> => {
  try {
    // Get initial groups data
    const initialGroups: Group[] = [
      {
        name: 'A',
        teams: ['REMAJA PUTRA A', 'PALAPA A', 'TOXNET A', 'PERU FC B', 'LEMKA B', 'PORBA JAYA A']
      },
      {
        name: 'B',
        teams: ['DL GUNS A', 'TOXNET B', 'PORBA JAYA B', 'PUTRA MANDIRI B', 'REMAJA PUTRA B', 'ARUMBA FC B']
      },
      {
        name: 'C',
        teams: ['GANESA A', 'REMAJA PUTRA C', 'PERU FC C', 'PERKID FC', 'PUTRA MANDIRI A', 'DL GUNS A']
      },
      {
        name: 'D',
        teams: ['LEMKA A', 'BALPAS FC', 'ARUMBA FC A', 'GANESA B', 'PERU FC A', 'PELANA FC']
      }
    ];
    
    // Save groups to Firestore
    for (const group of initialGroups) {
      await setDoc(doc(db, "groups", group.name), group);
    }
    
    // Create teams
    const teams: Team[] = [];
    for (const group of initialGroups) {
      for (const teamName of group.teams) {
        const teamId = generateId();
        const team: Team = {
          id: teamId,
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
        };
        
        teams.push(team);
        await setDoc(doc(db, "teams", teamId), team);
      }
    }
    
    return;
  } catch (error) {
    console.error("Error initializing teams data:", error);
    throw error;
  }
};

export const initializePlayersData = async (): Promise<void> => {
  try {
    // This is a placeholder. Actual implementation would depend on having a source of player data.
    // For now, we'll just create some sample players for each team.
    
    const teams = await getTeams();
    const positions = ['Kiper', 'Bek', 'Gelandang', 'Penyerang'];
    
    for (const team of teams) {
      // Skip if team already has players
      if (team.players && team.players.length > 0) continue;
      
      const updatedPlayers: Player[] = [];
      
      // Create 15 random players for each team
      for (let i = 1; i <= 15; i++) {
        const position = positions[Math.floor(Math.random() * positions.length)];
        const player: Player = {
          id: generateId(),
          name: `Pemain ${i}`,
          position: position,
          number: i,
          teamId: team.id,
          goals: 0,
          yellowCards: 0,
          redCards: 0,
          isBanned: false
        };
        
        updatedPlayers.push(player);
      }
      
      // Update team with new players
      team.players = updatedPlayers;
      await saveTeam(team);
    }
    
    return;
  } catch (error) {
    console.error("Error initializing players data:", error);
    throw error;
  }
};
