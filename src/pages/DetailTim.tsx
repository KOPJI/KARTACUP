import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Team, Player, Match } from '../types';
import { Calendar, Save, Trash2, UserPlus, Users, X, Shield, AlertTriangle, AlertCircle, Ban } from 'lucide-react';
import { getTeamById, getMatches, saveTeam } from '../utils/firebase';

interface PlayerFormData {
  name: string;
  position: string;
  number: number;
}

type ActiveTab = 'info' | 'players' | 'cards';

const DetailTim: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('info');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [playerForm, setPlayerForm] = useState<PlayerFormData>({
    name: '',
    position: '',
    number: 1
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Get team data from Firestore
        const foundTeam = await getTeamById(id);
        
        if (foundTeam) {
          setTeam(foundTeam);
        } else {
          navigate('/tim');
          return;
        }
        
        // Get matches for this team
        const allMatches = await getMatches();
        const teamMatches = allMatches.filter(
          m => m.homeTeamId === id || m.awayTeamId === id
        );
        setMatches(teamMatches);
      } catch (error) {
        console.error("Error fetching team data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPlayerForm({
      ...playerForm,
      [name]: name === 'number' ? parseInt(value) : value
    });
  };

  const addPlayer = async () => {
    if (!team) return;
    if (!playerForm.name || !playerForm.position) {
      alert('Silahkan isi semua data pemain');
      return;
    }
    
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: playerForm.name,
      position: playerForm.position,
      number: playerForm.number,
      teamId: team.id,
      goals: 0,
      yellowCards: 0,
      redCards: 0,
      isBanned: false
    };
    
    const updatedTeam = {
      ...team,
      players: [...team.players, newPlayer]
    };
    
    try {
      // Update in Firestore
      await saveTeam(updatedTeam);
      
      // Update in state
      setTeam(updatedTeam);
      
      // Reset form
      setPlayerForm({ name: '', position: '', number: 1 });
      setIsAddingPlayer(false);
      
      alert('Pemain berhasil ditambahkan');
    } catch (error) {
      console.error("Error adding player:", error);
      alert('Gagal menambahkan pemain');
    }
  };

  const removePlayer = async (playerId: string) => {
    if (!team) return;
    if (!confirm('Yakin ingin menghapus pemain ini?')) return;
    
    const updatedTeam = {
      ...team,
      players: team.players.filter(p => p.id !== playerId)
    };
    
    try {
      // Update in Firestore
      await saveTeam(updatedTeam);
      
      // Update in state
      setTeam(updatedTeam);
      
      alert('Pemain berhasil dihapus');
    } catch (error) {
      console.error("Error removing player:", error);
      alert('Gagal menghapus pemain');
    }
  };

  const updatePlayerCard = async (playerId: string, cardType: 'yellow' | 'red', increment: number) => {
    if (!team) return;
    
    const updatedPlayers = team.players.map(player => {
      if (player.id === playerId) {
        const updatedPlayer = { ...player };
        
        if (cardType === 'yellow') {
          updatedPlayer.yellowCards = Math.max(0, (player.yellowCards || 0) + increment);
          // Jika kartu kuning mencapai 2, pemain dilarang bermain
          updatedPlayer.isBanned = updatedPlayer.yellowCards >= 2 || (player.redCards || 0) > 0;
        } else {
          updatedPlayer.redCards = Math.max(0, (player.redCards || 0) + increment);
          // Jika ada kartu merah, pemain dilarang bermain
          updatedPlayer.isBanned = updatedPlayer.redCards > 0;
        }
        
        return updatedPlayer;
      }
      return player;
    });
    
    const updatedTeam = {
      ...team,
      players: updatedPlayers
    };
    
    try {
      // Update in Firestore
      await saveTeam(updatedTeam);
      
      // Update in state
      setTeam(updatedTeam);
    } catch (error) {
      console.error("Error updating player card:", error);
      alert('Gagal memperbarui kartu pemain');
    }
  };

  const togglePlayerBan = async (playerId: string) => {
    if (!team) return;
    
    const updatedPlayers = team.players.map(player => {
      if (player.id === playerId) {
        return {
          ...player,
          isBanned: !player.isBanned
        };
      }
      return player;
    });
    
    const updatedTeam = {
      ...team,
      players: updatedPlayers
    };
    
    try {
      // Update in Firestore
      await saveTeam(updatedTeam);
      
      // Update in state
      setTeam(updatedTeam);
    } catch (error) {
      console.error("Error toggling player ban:", error);
      alert('Gagal memperbarui status larangan bermain');
    }
  };

  const getTeamName = (id: string) => {
    const teams = JSON.parse(localStorage.getItem('teams') || '[]') as Team[];
    const team = teams.find(t => t.id === id);
    return team ? team.name : 'Tim tidak ditemukan';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700"></div>
      </div>
    );
  }

  if (!team) {
    return <div className="text-center py-8">Tim tidak ditemukan</div>;
  }

  const bannedPlayers = team.players.filter(player => player.isBanned);
  const yellowCardPlayers = team.players.filter(player => (player.yellowCards || 0) > 0);
  const redCardPlayers = team.players.filter(player => (player.redCards || 0) > 0);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center">
            <Users size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{team.name}</h2>
            <div className="text-slate-500">Grup {team.group} • {team.players.length} Pemain</div>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 text-center">
            <div className="text-sm text-slate-500">Pertandingan</div>
            <div className="text-xl font-bold mt-1">{team.played}</div>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-sm text-slate-500">Poin</div>
            <div className="text-xl font-bold mt-1">{team.points}</div>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-sm text-slate-500">M-S-K</div>
            <div className="text-xl font-bold mt-1">{team.won}-{team.drawn}-{team.lost}</div>
          </div>
        </div>
      </div>
      
      <div className="flex border-b overflow-x-auto">
        <button
          className={`tab ${activeTab === 'info' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <Shield size={18} className="mr-2" />
          Informasi Tim
        </button>
        <button
          className={`tab ${activeTab === 'players' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('players')}
        >
          <Users size={18} className="mr-2" />
          Daftar Pemain
        </button>
        <button
          className={`tab ${activeTab === 'cards' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('cards')}
        >
          <AlertTriangle size={18} className="mr-2" />
          Kartu & Larangan
          {(bannedPlayers.length > 0 || yellowCardPlayers.length > 0 || redCardPlayers.length > 0) && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {bannedPlayers.length}
            </span>
          )}
        </button>
      </div>
      
      {activeTab === 'info' && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar size={20} />
            Jadwal Pertandingan
          </h3>
          
          {matches.length > 0 ? (
            <div className="space-y-3">
              {matches.map(match => (
                <div key={match.id} className="border rounded-lg p-4">
                  <div className="text-sm text-slate-500 mb-2">
                    Grup {match.group} • {match.date || 'Jadwal belum ditentukan'}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">
                      {match.homeTeamId === team.id ? (
                        <span className="font-bold">{team.name}</span>
                      ) : (
                        getTeamName(match.homeTeamId)
                      )} vs {match.awayTeamId === team.id ? (
                        <span className="font-bold">{team.name}</span>
                      ) : (
                        getTeamName(match.awayTeamId)
                      )}
                    </div>
                    {match.status === 'completed' ? (
                      <div className="font-bold">
                        {match.homeScore} - {match.awayScore}
                      </div>
                    ) : (
                      <div className="badge badge-primary">Belum Dimulai</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Calendar size={36} className="mx-auto mb-2 text-slate-300" />
              <p>Belum ada jadwal pertandingan</p>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'players' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Daftar Pemain</h3>
            <button 
              className="btn btn-primary inline-flex items-center gap-2"
              onClick={() => setIsAddingPlayer(true)}
            >
              <UserPlus size={18} />
              <span>Tambah Pemain</span>
            </button>
          </div>
          
          {isAddingPlayer && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold">Tambah Pemain Baru</h4>
                <button 
                  className="text-slate-500 hover:text-slate-700"
                  onClick={() => setIsAddingPlayer(false)}
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nama</label>
                  <input
                    type="text"
                    name="name"
                    className="input"
                    value={playerForm.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Posisi</label>
                  <select
                    name="position"
                    className="input"
                    value={playerForm.position}
                    onChange={handleInputChange}
                  >
                    <option value="">Pilih Posisi</option>
                    <option value="Kiper">Kiper</option>
                    <option value="Bek">Bek</option>
                    <option value="Gelandang">Gelandang</option>
                    <option value="Penyerang">Penyerang</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nomor Punggung</label>
                  <input
                    type="number"
                    name="number"
                    min="1"
                    max="99"
                    className="input"
                    value={playerForm.number}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button 
                  className="btn btn-primary inline-flex items-center gap-2"
                  onClick={addPlayer}
                >
                  <Save size={18} />
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          )}
          
          {team.players.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama</th>
                    <th>Posisi</th>
                    <th>Gol</th>
                    <th>Kartu Kuning</th>
                    <th>Kartu Merah</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {team.players.map(player => (
                    <tr key={player.id} className={player.isBanned ? 'bg-red-50' : ''}>
                      <td>{player.number}</td>
                      <td>{player.name}</td>
                      <td>{player.position}</td>
                      <td>{player.goals}</td>
                      <td>{player.yellowCards || 0}</td>
                      <td>{player.redCards || 0}</td>
                      <td>
                        {player.isBanned ? (
                          <span className="text-red-600 text-xs">Larangan Bermain</span>
                        ) : (
                          <span className="text-green-600 text-xs">Aktif</span>
                        )}
                      </td>
                      <td>
                        <button 
                          className="text-red-500 hover:text-red-700 mr-2"
                          onClick={() => removePlayer(player.id)}
                          title="Hapus Pemain"
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
            <div className="text-center py-8 text-slate-500">
              <UserPlus size={36} className="mx-auto mb-2 text-slate-300" />
              <p>Belum ada pemain terdaftar</p>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'cards' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-amber-600">
              <AlertTriangle size={20} />
              Pemain dengan Kartu Kuning
            </h3>
            
            {yellowCardPlayers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nama</th>
                      <th>Posisi</th>
                      <th>Kartu Kuning</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yellowCardPlayers.map(player => (
                      <tr key={player.id} className={player.isBanned ? 'bg-red-50' : 'bg-amber-50'}>
                        <td>{player.number}</td>
                        <td>{player.name}</td>
                        <td>{player.position}</td>
                        <td>{player.yellowCards}</td>
                        <td>
                          {player.isBanned ? (
                            <span className="text-red-600 text-xs">Larangan Bermain</span>
                          ) : (
                            <span className="text-amber-600 text-xs">Peringatan</span>
                          )}
                        </td>
                        <td className="flex gap-2">
                          <button 
                            className="text-amber-600 hover:text-amber-800 p-1 bg-amber-100 rounded"
                            onClick={() => updatePlayerCard(player.id, 'yellow', 1)}
                            title="Tambah Kartu Kuning"
                          >
                            <AlertTriangle size={16} />
                          </button>
                          <button 
                            className="text-slate-600 hover:text-slate-800 p-1 bg-slate-100 rounded"
                            onClick={() => updatePlayerCard(player.id, 'yellow', -1)}
                            title="Kurangi Kartu Kuning"
                          >
                            <X size={16} />
                          </button>
                          <button 
                            className={`${player.isBanned ? 'text-green-600 hover:text-green-800 bg-green-100' : 'text-red-600 hover:text-red-800 bg-red-100'} p-1 rounded`}
                            onClick={() => togglePlayerBan(player.id)}
                            title={player.isBanned ? 'Aktifkan Pemain' : 'Larang Bermain'}
                          >
                            <Ban size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <AlertTriangle size={36} className="mx-auto mb-2 text-slate-300" />
                <p>Tidak ada pemain dengan kartu kuning</p>
              </div>
            )}
          </div>
          
          <div className="card">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-600">
              <AlertCircle size={20} />
              Pemain dengan Kartu Merah
            </h3>
            
            {redCardPlayers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nama</th>
                      <th>Posisi</th>
                      <th>Kartu Merah</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redCardPlayers.map(player => (
                      <tr key={player.id} className="bg-red-50">
                        <td>{player.number}</td>
                        <td>{player.name}</td>
                        <td>{player.position}</td>
                        <td>{player.redCards}</td>
                        <td>
                          <span className="text-red-600 text-xs">Larangan Bermain</span>
                        </td>
                        <td className="flex gap-2">
                          <button 
                            className="text-red-600 hover:text-red-800 p-1 bg-red-100 rounded"
                            onClick={() => updatePlayerCard(player.id, 'red', 1)}
                            title="Tambah Kartu Merah"
                          >
                            <AlertCircle size={16} />
                          </button>
                          <button 
                            className="text-slate-600 hover:text-slate-800 p-1 bg-slate-100 rounded"
                            onClick={() => updatePlayerCard(player.id, 'red', -1)}
                            title="Kurangi Kartu Merah"
                          >
                            <X size={16} />
                          </button>
                          <button 
                            className={`${player.isBanned ? 'text-green-600 hover:text-green-800 bg-green-100' : 'text-red-600 hover:text-red-800 bg-red-100'} p-1 rounded`}
                            onClick={() => togglePlayerBan(player.id)}
                            title={player.isBanned ? 'Aktifkan Pemain' : 'Larang Bermain'}
                          >
                            <Ban size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <AlertCircle size={36} className="mx-auto mb-2 text-slate-300" />
                <p>Tidak ada pemain dengan kartu merah</p>
              </div>
            )}
          </div>
          
          <div className="card">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-600">
              <Ban size={20} />
              Pemain dengan Larangan Bermain
            </h3>
            
            {bannedPlayers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nama</th>
                      <th>Posisi</th>
                      <th>Kartu Kuning</th>
                      <th>Kartu Merah</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bannedPlayers.map(player => (
                      <tr key={player.id} className="bg-red-50">
                        <td>{player.number}</td>
                        <td>{player.name}</td>
                        <td>{player.position}</td>
                        <td>{player.yellowCards || 0}</td>
                        <td>{player.redCards || 0}</td>
                        <td>
                          <button 
                            className="text-green-600 hover:text-green-800 p-1 bg-green-100 rounded"
                            onClick={() => togglePlayerBan(player.id)}
                            title="Aktifkan Pemain"
                          >
                            <Ban size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Ban size={36} className="mx-auto mb-2 text-slate-300" />
                <p>Tidak ada pemain dengan larangan bermain</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailTim;
