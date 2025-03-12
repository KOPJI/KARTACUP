import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Match, Team, Player, GoalScorer, Card } from '../types';
import { Calendar, Clock, Save, Trash2, Trophy, User } from 'lucide-react';
import { updateMatch } from '../utils/dataInitializer';

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
    type: 'yellow',
    minute: 1
  });

  useEffect(() => {
    if (!id) return;
    
    const matchesData = JSON.parse(localStorage.getItem('matches') || '[]') as Match[];
    const foundMatch = matchesData.find(m => m.id === id);
    
    if (foundMatch) {
      setMatch(foundMatch);
      
      if (foundMatch.homeScore !== null) {
        setHomeScore(foundMatch.homeScore);
      }
      
      if (foundMatch.awayScore !== null) {
        setAwayScore(foundMatch.awayScore);
      }
      
      // Load teams
      const teamsData = JSON.parse(localStorage.getItem('teams') || '[]') as Team[];
      setHomeTeam(teamsData.find(t => t.id === foundMatch.homeTeamId) || null);
      setAwayTeam(teamsData.find(t => t.id === foundMatch.awayTeamId) || null);
    } else {
      navigate('/jadwal');
    }
  }, [id, navigate]);

  const handleSaveScore = () => {
    if (!match) return;
    
    const updatedMatch: Match = {
      ...match,
      homeScore,
      awayScore,
      status: 'completed'
    };
    
    setMatch(updatedMatch);
    updateMatch(updatedMatch);
    
    alert('Hasil pertandingan berhasil disimpan!');
  };

  const handleAddGoal = () => {
    if (!match) return;
    if (!goalForm.teamId || !goalForm.playerId) {
      alert('Pilih tim dan pemain yang mencetak gol');
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
    
    setMatch(updatedMatch);
    updateMatch(updatedMatch);
    
    // Update player stats
    const teamsData = JSON.parse(localStorage.getItem('teams') || '[]') as Team[];
    const updatedTeams = teamsData.map(team => {
      if (team.id === goalForm.teamId) {
        return {
          ...team,
          players: team.players.map(player => {
            if (player.id === goalForm.playerId) {
              return {
                ...player,
                goals: player.goals + 1
              };
            }
            return player;
          })
        };
      }
      return team;
    });
    
    localStorage.setItem('teams', JSON.stringify(updatedTeams));
    
    // Reset form
    setGoalForm({
      teamId: '',
      playerId: '',
      minute: 1
    });
    
    alert('Gol berhasil ditambahkan!');
  };

  const handleAddCard = () => {
    if (!match) return;
    if (!cardForm.teamId || !cardForm.playerId) {
      alert('Pilih tim dan pemain yang mendapat kartu');
      return;
    }
    
    const newCard: Card = {
      id: Date.now().toString(),
      matchId: match.id,
      teamId: cardForm.teamId,
      playerId: cardForm.playerId,
      type: cardForm.type as 'yellow' | 'red',
      minute: cardForm.minute
    };
    
    const updatedMatch: Match = {
      ...match,
      cards: [...match.cards, newCard]
    };
    
    setMatch(updatedMatch);
    updateMatch(updatedMatch);
    
    // Update player stats
    const teamsData = JSON.parse(localStorage.getItem('teams') || '[]') as Team[];
    const updatedTeams = teamsData.map(team => {
      if (team.id === cardForm.teamId) {
        return {
          ...team,
          players: team.players.map(player => {
            if (player.id === cardForm.playerId) {
              const updatedPlayer = {
                ...player,
                yellowCards: cardForm.type === 'yellow' ? player.yellowCards + 1 : player.yellowCards,
                redCards: cardForm.type === 'red' ? player.redCards + 1 : player.redCards
              };
              
              // Check for ban (2 yellow cards or 1 red card)
              if (
                (cardForm.type === 'yellow' && updatedPlayer.yellowCards >= 2) || 
                (cardForm.type === 'red') ||
                updatedPlayer.redCards > 0
              ) {
                updatedPlayer.isBanned = true;
              }
              
              return updatedPlayer;
            }
            return player;
          })
        };
      }
      return team;
    });
    
    localStorage.setItem('teams', JSON.stringify(updatedTeams));
    
    // Reset form
    setCardForm({
      teamId: '',
      playerId: '',
      type: 'yellow',
      minute: 1
    });
    
    alert('Kartu berhasil ditambahkan!');
  };

  const getPlayerName = (teamId: string, playerId: string): string => {
    const team = teamId === homeTeam?.id ? homeTeam : awayTeam;
    const player = team?.players.find(p => p.id === playerId);
    return player ? player.name : 'Pemain tidak ditemukan';
  };

  const removeGoal = (goalId: string) => {
    if (!match) return;
    if (!confirm('Yakin ingin menghapus gol ini?')) return;
    
    const goalToRemove = match.scorers.find(g => g.id === goalId);
    if (!goalToRemove) return;
    
    const updatedMatch: Match = {
      ...match,
      scorers: match.scorers.filter(g => g.id !== goalId)
    };
    
    setMatch(updatedMatch);
    updateMatch(updatedMatch);
    
    // Update player stats
    const teamsData = JSON.parse(localStorage.getItem('teams') || '[]') as Team[];
    const updatedTeams = teamsData.map(team => {
      if (team.id === goalToRemove.teamId) {
        return {
          ...team,
          players: team.players.map(player => {
            if (player.id === goalToRemove.playerId) {
              return {
                ...player,
                goals: Math.max(0, player.goals - 1)
              };
            }
            return player;
          })
        };
      }
      return team;
    });
    
    localStorage.setItem('teams', JSON.stringify(updatedTeams));
  };

  const removeCard = (cardId: string) => {
    if (!match) return;
    if (!confirm('Yakin ingin menghapus kartu ini?')) return;
    
    const cardToRemove = match.cards.find(c => c.id === cardId);
    if (!cardToRemove) return;
    
    const updatedMatch: Match = {
      ...match,
      cards: match.cards.filter(c => c.id !== cardId)
    };
    
    setMatch(updatedMatch);
    updateMatch(updatedMatch);
    
    // Update player stats
    const teamsData = JSON.parse(localStorage.getItem('teams') || '[]') as Team[];
    const updatedTeams = teamsData.map(team => {
      if (team.id === cardToRemove.teamId) {
        return {
          ...team,
          players: team.players.map(player => {
            if (player.id === cardToRemove.playerId) {
              const updatedPlayer = {
                ...player,
                yellowCards: cardToRemove.type === 'yellow' ? Math.max(0, player.yellowCards - 1) : player.yellowCards,
                redCards: cardToRemove.type === 'red' ? Math.max(0, player.redCards - 1) : player.redCards
              };
              
              // Recalculate ban status
              updatedPlayer.isBanned = updatedPlayer.yellowCards >= 2 || updatedPlayer.redCards > 0;
              
              return updatedPlayer;
            }
            return player;
          })
        };
      }
      return team;
    });
    
    localStorage.setItem('teams', JSON.stringify(updatedTeams));
  };

  if (!match || !homeTeam || !awayTeam) {
    return <div className="text-center py-8">Loading...</div>;
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
              {match.scorers.length > 0 ? (
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
              {match.cards.length > 0 ? (
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
            {match.scorers.length > 0 ? (
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
                    onChange={(e) => setCardForm({ ...cardForm, type: e.target.value })}
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
            {match.cards.length > 0 ? (
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
