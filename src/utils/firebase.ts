import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, getDocs, getDoc, deleteDoc, query, where, addDoc, updateDoc, writeBatch } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
const storage = getStorage(app);

// Konfigurasi CORS untuk Storage
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://kartacupv.vercel.app',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// Konstanta untuk validasi dan kompresi gambar
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const MAX_IMAGE_WIDTH = 800; // Maksimal lebar gambar
const MAX_IMAGE_HEIGHT = 800; // Maksimal tinggi gambar
const COMPRESSION_QUALITY = 0.7; // Kualitas kompresi (0-1)

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
    // Periksa apakah data grup sudah ada di Firestore
    const existingGroupsSnapshot = await getDocs(collection(db, "groups"));
    if (existingGroupsSnapshot.size > 0) {
      console.log("Data grup sudah ada di Firestore. Menghapus data lama...");
      
      // Hapus semua grup yang ada
      const batch = writeBatch(db);
      existingGroupsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      // Hapus semua tim yang ada
      const existingTeamsSnapshot = await getDocs(collection(db, "teams"));
      if (existingTeamsSnapshot.size > 0) {
        const teamsBatch = writeBatch(db);
        existingTeamsSnapshot.forEach((doc) => {
          teamsBatch.delete(doc.ref);
        });
        await teamsBatch.commit();
      }
    }
    
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
        teams: ['GANESA A', 'REMAJA PUTRA C', 'PERU FC C', 'PERKID FC', 'PUTRA MANDIRI A', 'DL GUNS B']
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
    // Gunakan Set untuk melacak nama tim yang sudah dibuat untuk mencegah duplikasi
    const createdTeamNames = new Set<string>();
    
    for (const group of initialGroups) {
      for (const teamName of group.teams) {
        // Lewati jika tim dengan nama yang sama sudah dibuat
        if (createdTeamNames.has(teamName)) {
          console.log(`Tim ${teamName} sudah ada, melewati...`);
          continue;
        }
        
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
        createdTeamNames.add(teamName);
      }
    }
    
    console.log(`Berhasil membuat ${teams.length} tim`);
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

// Fungsi untuk validasi file
const validateImageFile = (file: File) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Tipe file tidak didukung. Gunakan file JPG atau PNG.');
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Ukuran file terlalu besar. Maksimal 2MB.');
  }
};

// Fungsi untuk mengkompresi gambar
const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      // Hitung dimensi yang proporsional
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > MAX_IMAGE_WIDTH) {
          height = Math.round((height * MAX_IMAGE_WIDTH) / width);
          width = MAX_IMAGE_WIDTH;
        }
      } else {
        if (height > MAX_IMAGE_HEIGHT) {
          width = Math.round((width * MAX_IMAGE_HEIGHT) / height);
          height = MAX_IMAGE_HEIGHT;
        }
      }
      
      // Buat canvas untuk kompresi
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Gambar ke canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Gagal membuat context canvas'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Konversi ke blob dengan kompresi
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Gagal mengkompresi gambar'));
          }
        },
        file.type,
        COMPRESSION_QUALITY
      );
      
      // Bersihkan URL object
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => {
      reject(new Error('Gagal memuat gambar'));
      URL.revokeObjectURL(img.src);
    };
  });
};

// Fungsi untuk mengkonversi Blob ke base64
const convertBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Upload logo tim
export const uploadTeamLogo = async (teamId: string, file: File): Promise<string> => {
  try {
    // Validasi file
    validateImageFile(file);
    
    // Kompresi gambar
    const compressedBlob = await compressImage(file);
    
    // Konversi ke base64
    const base64Image = await convertBlobToBase64(compressedBlob);
    
    // Update tim dengan URL base64
    const team = await getTeamById(teamId);
    if (team) {
      team.logoUrl = base64Image;
      await saveTeam(team);
    }
    
    return base64Image;
  } catch (error) {
    console.error("Error uploading team logo:", error);
    throw error;
  }
};

// Upload foto pemain
export const uploadPlayerPhoto = async (teamId: string, playerId: string, file: File): Promise<string> => {
  try {
    // Validasi file
    validateImageFile(file);
    
    // Kompresi gambar
    const compressedBlob = await compressImage(file);
    
    // Konversi ke base64
    const base64Image = await convertBlobToBase64(compressedBlob);
    
    // Update pemain dengan URL base64
    const team = await getTeamById(teamId);
    if (team) {
      const updatedPlayers = team.players.map(player => {
        if (player.id === playerId) {
          return { ...player, photoUrl: base64Image };
        }
        return player;
      });
      
      team.players = updatedPlayers;
      await saveTeam(team);
    }
    
    return base64Image;
  } catch (error) {
    console.error("Error uploading player photo:", error);
    throw error;
  }
};

// Fungsi untuk mengupdate kartu pemain
export const updatePlayerCard = async (
  teamId: string,
  playerId: string,
  cardType: 'yellow' | 'red',
  increment: number
): Promise<void> => {
  try {
    const team = await getTeamById(teamId);
    if (!team) throw new Error('Tim tidak ditemukan');

    const updatedPlayers = team.players.map(player => {
      if (player.id === playerId) {
        const updatedPlayer = { ...player };
        
        if (cardType === 'yellow') {
          updatedPlayer.yellowCards = Math.max(0, (player.yellowCards || 0) + increment);
          // Jika kartu kuning mencapai 3, pemain dilarang bermain
          if (updatedPlayer.yellowCards >= 3 && !player.isBanned) {
            updatedPlayer.isBanned = true;
            updatedPlayer.banReason = 'Akumulasi 3 Kartu Kuning';
            updatedPlayer.banDate = new Date().toISOString();
          }
        } else {
          updatedPlayer.redCards = Math.max(0, (player.redCards || 0) + increment);
          // Jika ada kartu merah, pemain dilarang bermain
          if (updatedPlayer.redCards > 0 && !player.isBanned) {
            updatedPlayer.isBanned = true;
            updatedPlayer.banReason = 'Kartu Merah Langsung';
            updatedPlayer.banDate = new Date().toISOString();
          }
        }
        
        return updatedPlayer;
      }
      return player;
    });

    // Update tim dengan data pemain yang baru
    await saveTeam({ ...team, players: updatedPlayers });
    
    // Simpan data kartu ke koleksi terpisah untuk tracking
    const cardId = generateId();
    await setDoc(doc(db, `cards_${cardType}`, cardId), {
      id: cardId,
      playerId,
      teamId,
      type: cardType,
      date: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error updating player card:", error);
    throw error;
  }
};

// Fungsi untuk mengaktifkan/melarang pemain bermain
export const togglePlayerBan = async (
  teamId: string,
  playerId: string,
  shouldBan: boolean,
  reason?: string
): Promise<void> => {
  try {
    const team = await getTeamById(teamId);
    if (!team) throw new Error('Tim tidak ditemukan');

    const updatedPlayers = team.players.map(player => {
      if (player.id === playerId) {
        return {
          ...player,
          isBanned: shouldBan,
          banReason: shouldBan ? (reason || 'Keputusan Admin') : undefined,
          banDate: shouldBan ? new Date().toISOString() : undefined
        };
      }
      return player;
    });

    // Update tim dengan data pemain yang baru
    await saveTeam({ ...team, players: updatedPlayers });

    // Simpan riwayat larangan bermain
    if (shouldBan) {
      const banId = generateId();
      await setDoc(doc(db, 'bans', banId), {
        id: banId,
        playerId,
        teamId,
        reason: reason || 'Keputusan Admin',
        date: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error("Error toggling player ban:", error);
    throw error;
  }
};

// Fungsi untuk mendapatkan statistik kartu dan larangan
export const getCardStats = async (): Promise<{
  yellowCards: number;
  redCards: number;
  bannedPlayers: number;
}> => {
  try {
    const teams = await getTeams();
    let yellowCards = 0;
    let redCards = 0;
    let bannedPlayers = 0;

    teams.forEach(team => {
      team.players.forEach(player => {
        yellowCards += player.yellowCards || 0;
        redCards += player.redCards || 0;
        if (player.isBanned) bannedPlayers++;
      });
    });

    return { yellowCards, redCards, bannedPlayers };
  } catch (error) {
    console.error("Error getting card stats:", error);
    return { yellowCards: 0, redCards: 0, bannedPlayers: 0 };
  }
};
