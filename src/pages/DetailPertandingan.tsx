import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Match, Team, Player, GoalScorer, Card } from '../types';
import { Calendar, Clock, Save, Trash2, Trophy, User } from 'lucide-react';
import { getMatchById, getTeamById, saveMatch, saveTeam } from '../utils/firebase';

const DetailPertandingan: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'summary' | 'goals' | 'cards'>('summary');
  const [goalForm, setGoalForm] = useState({
    teamId: '',
    playerId: '',
    minute: 1
  });
  const [cardForm, setCardForm] = useState({
    teamId: '',
    playerId: '',
    type: 'yellow' as 'yellow' | 'red',
    minute: 1
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Get match data from Firestore
        const foundMatch = await getMatchById(id);
        
        if (foundMatch) {
          setMatch(foundMatch);
          
          if (foundMatch.homeScore !== null) {
            setHomeScore(foundMatch.homeScore);
          }
          
          if (foundMatch.awayScore !== null) {
            setAwayScore(foundMatch.awayScore);
          }
          
          // Load teams from Firestore
          const homeTeamData = await getTeamById(foundMatch.homeTeamId);
          const awayTeamData = await getTeamById(foundMatch.awayTeamId);
          
          setHomeTeam(homeTeamData || null);
          setAwayTeam(awayTeamData || null);
        } else {
          navigate('/jadwal');
        }
      } catch (error) {
        console.error("Error fetching match data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, navigate]);

  const handleSaveScore = async () => {
    if (!match) return;
    
    const updatedMatch: Match = {
      ...match,
      homeScore,
      awayScore,
      status: 'completed'
    };
    
    try {
      // Save to Firestore
      await saveMatch(updatedMatch);
      
      // Update local state
      setMatch(updatedMatch);
      
      alert('Skor berhasil disimpan');
      
      // Update team statistics
      await updateTeamStats(updatedMatch);
    } catch (error) {
      console.error("Error saving score:", error);
      alert('Gagal menyimpan skor');
    }
  };

  const handleAddGoal = async () => {
    if (!match || !goalForm.teamId || !goalForm.playerId) {
      alert('Pilih tim dan pemain');
      return;
    }
    
    const newGoal: GoalScorer = {
      id: Date.now().toString(),
      matchId: match.id,
      teamId: goalForm.teamId,
      playerId: goalForm.playerId,
      minute: goalForm.minute
    };
    
    const updatedMatch: Match = {
      ...match,
      scorers: [...match.scorers, newGoal]
    };
    
    try {
      // Update match in Firestore
      await saveMatch(updatedMatch);
      
      // Update local state
      setMatch(updatedMatch);
      
      // Update player stats
      if (goalForm.teamId === match.homeTeamId && homeTeam) {
        const updatedHomeTeam = updatePlayerGoals(homeTeam, goalForm.playerId);
        setHomeTeam(updatedHomeTeam);
        await saveTeam(updatedHomeTeam);
      } else if (goalForm.teamId === match.awayTeamId && awayTeam) {
        const updatedAwayTeam = updatePlayerGoals(awayTeam, goalForm.playerId);
        setAwayTeam(updatedAwayTeam);
        await saveTeam(updatedAwayTeam);
      }
      
      // Reset form
      setGoalForm({
        teamId: '',
        playerId: '',
        minute: 1
      });
    } catch (error) {
      console.error("Error adding goal:", error);
      alert('Gagal menambahkan gol');
    }
  };

  const handleAddCard = async () => {
    if (!match || !cardForm.teamId || !cardForm.playerId) {
      alert('Pilih tim dan pemain');
      return;
    }
    
    const newCard: Card = {
      id: Date.now().toString(),
      matchId: match.id,
      teamId: cardForm.teamId,
      playerId: cardForm.playerId,
      type: cardForm.type,
      minute: cardForm.minute
    };
    
    const updatedMatch: Match = {
      ...match,
      cards: [...(match.cards || []), newCard]
    };
    
    try {
      // Update match in Firestore
      await saveMatch(updatedMatch);
      
      // Update local state
      setMatch(updatedMatch);
      
      // Update player stats
      if (cardForm.teamId === match.homeTeamId && homeTeam) {
        const updatedHomeTeam = updatePlayerCards(homeTeam, cardForm.playerId, cardForm.type);
        setHomeTeam(updatedHomeTeam);
        await saveTeam(updatedHomeTeam);
      } else if (cardForm.teamId === match.awayTeamId && awayTeam) {
        const updatedAwayTeam = updatePlayerCards(awayTeam, cardForm.playerId, cardForm.type);
        setAwayTeam(updatedAwayTeam);
        await saveTeam(updatedAwayTeam);
      }
      
      // Reset form
      setCardForm({
        teamId: '',
        playerId: '',
        type: 'yellow',
        minute: 1
      });
    } catch (error) {
      console.error("Error adding card:", error);
      alert('Gagal menambahkan kartu');
    }
  };

  const getPlayerName = (teamId: string, playerId: string): string => {
    const team = teamId === match?.homeTeamId ? homeTeam : awayTeam;
    const player = team?.players.find(p => p.id === playerId);
    return player ? player.name : 'Pemain tidak ditemukan';
  };

  const removeGoal = async (goalId: string) => {
    if (!match) return;
    if (!confirm('Yakin ingin menghapus gol ini?')) return;
    
    const goalToRemove = match.scorers.find(g => g.id === goalId);
    if (!goalToRemove) return;
    
    const updatedMatch: Match = {
      ...match,
      scorers: match.scorers.filter(g => g.id !== goalId)
    };
    
    try {
      // Update match in Firestore
      await saveMatch(updatedMatch);
      
      // Update local state
      setMatch(updatedMatch);
      
      // Update player stats
      if (goalToRemove.teamId === match.homeTeamId && homeTeam) {
        const updatedHomeTeam = decrementPlayerGoals(homeTeam, goalToRemove.playerId);
        setHomeTeam(updatedHomeTeam);
        await saveTeam(updatedHomeTeam);
      } else if (goalToRemove.teamId === match.awayTeamId && awayTeam) {
        const updatedAwayTeam = decrementPlayerGoals(awayTeam, goalToRemove.playerId);
        setAwayTeam(updatedAwayTeam);
        await saveTeam(updatedAwayTeam);
      }
    } catch (error) {
      console.error("Error removing goal:", error);
      alert('Gagal menghapus gol');
    }
  };

  const removeCard = async (cardId: string) => {
    if (!match) return;
    if (!confirm('Yakin ingin menghapus kartu ini?')) return;
    
    const cardToRemove = match.cards?.find(c => c.id === cardId);
    if (!cardToRemove) return;
    
    const updatedMatch: Match = {
      ...match,
      cards: match.cards?.filter(c => c.id !== cardId) || []
    };
    
    try {
      // Update match in Firestore
      await saveMatch(updatedMatch);
      
      // Update local state
      setMatch(updatedMatch);
      
      // Update player stats
      if (cardToRemove.teamId === match.homeTeamId && homeTeam) {
        const updatedHomeTeam = decrementPlayerCards(homeTeam, cardToRemove.playerId, cardToRemove.type);
        setHomeTeam(updatedHomeTeam);
        await saveTeam(updatedHomeTeam);
      } else if (cardToRemove.teamId === match.awayTeamId && awayTeam) {
        const updatedAwayTeam = decrementPlayerCards(awayTeam, cardToRemove.playerId, cardToRemove.type);
        setAwayTeam(updatedAwayTeam);
        await saveTeam(updatedAwayTeam);
      }
    } catch (error) {
      console.error("Error removing card:", error);
      alert('Gagal menghapus kartu');
    }
  };

  // Helper functions
  const updatePlayerGoals = (team: Team, playerId: string): Team => {
    const updatedPlayers = team.players.map(player => {
      if (player.id === playerId) {
        return {
          ...player,
          goals: (player.goals || 0) + 1
        };
      }
      return player;
    });
    
    return {
      ...team,
      players: updatedPlayers
    };
  };

  const decrementPlayerGoals = (team: Team, playerId: string): Team => {
    const updatedPlayers = team.players.map(player => {
      if (player.id === playerId) {
        return {
          ...player,
          goals: Math.max(0, (player.goals || 0) - 1)
        };
      }
      return player;
    });
    
    return {
      ...team,
      players: updatedPlayers
    };
  };

  const updatePlayerCards = (team: Team, playerId: string, cardType: string): Team => {
    const updatedPlayers = team.players.map(player => {
      if (player.id === playerId) {
        if (cardType === 'yellow') {
          const yellowCards = (player.yellowCards || 0) + 1;
          return {
            ...player,
            yellowCards,
            isBanned: yellowCards >= 2 || (player.redCards || 0) > 0
          };
        } else {
          const redCards = (player.redCards || 0) + 1;
          return {
            ...player,
            redCards,
            isBanned: true
          };
        }
      }
      return player;
    });
    
    return {
      ...team,
      players: updatedPlayers
    };
  };

  const decrementPlayerCards = (team: Team, playerId: string, cardType: string): Team => {
    const updatedPlayers = team.players.map(player => {
      if (player.id === playerId) {
        if (cardType === 'yellow') {
          const yellowCards = Math.max(0, (player.yellowCards || 0) - 1);
          return {
            ...player,
            yellowCards,
            isBanned: yellowCards >= 2 || (player.redCards || 0) > 0
          };
        } else {
          const redCards = Math.max(0, (player.redCards || 0) - 1);
          return {
            ...player,
            redCards,
            isBanned: redCards > 0
          };
        }
      }
      return player;
    });
    
    return {
      ...team,
      players: updatedPlayers
    };
  };

  const updateTeamStats = async (match: Match) => {
    if (!homeTeam || !awayTeam || match.homeScore === null || match.awayScore === null) return;
    
    // Update home team stats
    let updatedHomeTeam = { ...homeTeam };
    updatedHomeTeam.played = (updatedHomeTeam.played || 0) + 1;
    updatedHomeTeam.goalsFor = (updatedHomeTeam.goalsFor || 0) + match.homeScore;
    updatedHomeTeam.goalsAgainst = (updatedHomeTeam.goalsAgainst || 0) + match.awayScore;
    
    // Update away team stats
    let updatedAwayTeam = { ...awayTeam };
    updatedAwayTeam.played = (updatedAwayTeam.played || 0) + 1;
    updatedAwayTeam.goalsFor = (updatedAwayTeam.goalsFor || 0) + match.awayScore;
    updatedAwayTeam.goalsAgainst = (updatedAwayTeam.goalsAgainst || 0) + match.homeScore;
    
    // Update win/draw/loss and points
    if (match.homeScore > match.awayScore) {
      // Home team wins
      updatedHomeTeam.won = (updatedHomeTeam.won || 0) + 1;
      updatedHomeTeam.points = (updatedHomeTeam.points || 0) + 3;
      updatedAwayTeam.lost = (updatedAwayTeam.lost || 0) + 1;
    } else if (match.homeScore < match.awayScore) {
      // Away team wins
      updatedAwayTeam.won = (updatedAwayTeam.won || 0) + 1;
      updatedAwayTeam.points = (updatedAwayTeam.points || 0) + 3;
      updatedHomeTeam.lost = (updatedHomeTeam.lost || 0) + 1;
    } else {
      // Draw
      updatedHomeTeam.drawn = (updatedHomeTeam.drawn || 0) + 1;
      updatedHomeTeam.points = (updatedHomeTeam.points || 0) + 1;
      updatedAwayTeam.drawn = (updatedAwayTeam.drawn || 0) + 1;
      updatedAwayTeam.points = (updatedAwayTeam.points || 0) + 1;
    }
    
    try {
      // Save updated teams to Firestore
      await saveTeam(updatedHomeTeam);
      await saveTeam(updatedAwayTeam);
      
      // Update local state
      setHomeTeam(updatedHomeTeam);
      setAwayTeam(updatedAwayTeam);
    } catch (error) {
      console.error("Error updating team stats:", error);
      alert('Gagal memperbarui statistik tim');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700"></div>
      </div>
    );
  }

  if (!match || !homeTeam || !awayTeam) {
    return <div className="text-center py-8">Pertandingan tidak ditemukan</div>;
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="badge badge-primary">Grup {match.group}</div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar size={16} />
            <span>{match.date || 'Belum dijadwalkan'}</span>
            {match.time && (
              <>
                <Clock size={16} className="ml-2" />
                <span>{match.time}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-center gap-8 py-6">
          <div className="text-center">
            <div className="font-bold text-xl mb-2">{homeTeam.name}</div>
            <div className="text-sm text-slate-500">Tuan Rumah</div>
          </div>
          
          <div className="flex items-center gap-6">
            <input
              type="number"
              min="0"
              className="w-16 h-16 text-2xl font-bold text-center border rounded-md"
              value={homeScore}
              onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
            />
            <div className="text-xl">-</div>
            <input
              type="number"
              min="0"
              className="w-16 h-16 text-2xl font-bold text-center border rounded-md"
              value={awayScore}
              onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div className="text-center">
            <div className="font-bold text-xl mb-2">{awayTeam.name}</div>
            <div className="text-sm text-slate-500">Tamu</div>
          </div>
        </div>
        
        <div className="flex justify-center mt-4">
          <button 
            className="btn btn-primary inline-flex items-center gap-2"
            onClick={handleSaveScore}
          >
            <Save size={18} />
            <span>Simpan Hasil</span>
          </button>
        </div>
      </div>
      
      <div className="card">
        <div className="flex border-b overflow-x-auto mb-4">
          <button
            className={`tab ${activeTab === 'summary' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            Ringkasan
          </button>
          <button
            className={`tab ${activeTab === 'goals' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('goals')}
          >
            Pencetak Gol
          </button>
          <button
            className={`tab ${activeTab === 'cards' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('cards')}
          >
            Kartu
          </button>
        </div>
        
        {activeTab === 'summary' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Pencetak Gol</h3>
              {match.scorers?.length > 0 ? (
                <div className="space-y-2">
                  {match.scorers.map(scorer => (
                    <div key={scorer.id} className="flex items-center gap-2">
                      <Trophy size={16} className="text-amber-500" />
                      <span>
                        {getPlayerName(scorer.teamId, scorer.playerId)} ({scorer.minute}')
                      </span>
                      <span className="text-sm text-slate-500">
                        {scorer.teamId === homeTeam.id ? homeTeam.name : awayTeam.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500">Belum ada gol</div>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Kartu</h3>
              {match.cards?.length > 0 ? (
                <div className="space-y-2">
                  {match.cards.map(card => (
                    <div key={card.id} className="flex items-center gap-2">
                      <div 
                        className={`w-4 h-6 rounded-sm ${card.type === 'yellow' ? 'bg-amber-400' : 'bg-red-500'}`}
                      ></div>
                      <span>
                        {getPlayerName(card.teamId, card.playerId)} ({card.minute}')
                      </span>
                      <span className="text-sm text-slate-500">
                        {card.teamId === homeTeam.id ? homeTeam.name : awayTeam.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500">Belum ada kartu</div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'goals' && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Tambah Pencetak Gol</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tim</label>
                  <select
                    className="input"
                    value={goalForm.teamId}
                    onChange={(e) => setGoalForm({ ...goalForm, teamId: e.target.value, playerId: '' })}
                  >
                    <option value="">Pilih Tim</option>
                    <option value={homeTeam.id}>{homeTeam.name}</option>
                    <option value={awayTeam.id}>{awayTeam.name}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Pemain</label>
                  <select
                    className="input"
                    value={goalForm.playerId}
                    onChange={(e) => setGoalForm({ ...goalForm, playerId: e.target.value })}
                  >
                    <option value="">Pilih Pemain</option>
                    {goalForm.teamId === homeTeam.id && homeTeam.players.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.number} - {player.name}
                      </option>
                    ))}
                    {goalForm.teamId === awayTeam.id && awayTeam.players.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.number} - {player.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Menit</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    className="input"
                    value={goalForm.minute}
                    onChange={(e) => setGoalForm({ ...goalForm, minute: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button 
                  className="btn btn-primary"
                  onClick={handleAddGoal}
                >
                  Tambah Gol
                </button>
              </div>
            </div>
            
            <h3 className="font-semibold mt-4 mb-2">Daftar Pencetak Gol</h3>
            {match.scorers?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th>Menit</th>
                      <th>Pemain</th>
                      <th>Tim</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {match.scorers.map(scorer => (
                      <tr key={scorer.id}>
                        <td>{scorer.minute}'</td>
                        <td>{getPlayerName(scorer.teamId, scorer.playerId)}</td>
                        <td>{scorer.teamId === homeTeam.id ? homeTeam.name : awayTeam.name}</td>
                        <td>
                          <button 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => removeGoal(scorer.id)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <Trophy size={36} className="mx-auto mb-2 text-slate-300" />
                <p>Belum ada pencetak gol</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'cards' && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Tambah Kartu</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tim</label>
                  <select
                    className="input"
                    value={cardForm.teamId}
                    onChange={(e) => setCardForm({ ...cardForm, teamId: e.target.value, playerId: '' })}
                  >
                    <option value="">Pilih Tim</option>
                    <option value={homeTeam.id}>{homeTeam.name}</option>
                    <option value={awayTeam.id}>{awayTeam.name}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Pemain</label>
                  <select
                    className="input"
                    value={cardForm.playerId}
                    onChange={(e) => setCardForm({ ...cardForm, playerId: e.target.value })}
                  >
                    <option value="">Pilih Pemain</option>
                    {cardForm.teamId === homeTeam.id && homeTeam.players.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.number} - {player.name}
                      </option>
                    ))}
                    {cardForm.teamId === awayTeam.id && awayTeam.players.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.number} - {player.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Jenis Kartu</label>
                  <select
                    className="input"
                    value={cardForm.type}
                    onChange={(e) => setCardForm({ ...cardForm, type: e.target.value as 'yellow' | 'red' })}
                  >
                    <option value="yellow">Kartu Kuning</option>
                    <option value="red">Kartu Merah</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Menit</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    className="input"
                    value={cardForm.minute}
                    onChange={(e) => setCardForm({ ...cardForm, minute: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button 
                  className="btn btn-primary"
                  onClick={handleAddCard}
                >
                  Tambah Kartu
                </button>
              </div>
            </div>
            
            <h3 className="font-semibold mt-4 mb-2">Daftar Kartu</h3>
            {match.cards?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th>Menit</th>
                      <th>Pemain</th>
                      <th>Tim</th>
                      <th>Jenis</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {match.cards.map(card => (
                      <tr key={card.id}>
                        <td>{card.minute}'</td>
                        <td>{getPlayerName(card.teamId, card.playerId)}</td>
                        <td>{card.teamId === homeTeam.id ? homeTeam.name : awayTeam.name}</td>
                        <td>
                          <div 
                            className={`w-4 h-6 rounded-sm ${card.type === 'yellow' ? 'bg-amber-400' : 'bg-red-500'}`}
                          ></div>
                        </td>
                        <td>
                          <button 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => removeCard(card.id)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <User size={36} className="mx-auto mb-2 text-slate-300" />
                <p>Belum ada kartu</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailPertandingan;
