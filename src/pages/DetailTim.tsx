import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Team, Player, Match } from '../types';
import { Calendar, Save, Trash2, UserPlus, Users, X } from 'lucide-react';

interface PlayerFormData {
  name: string;
  position: string;
  number: number;
}

const DetailTim: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [playerForm, setPlayerForm] = useState<PlayerFormData>({
    name: '',
    position: '',
    number: 1
  });

  useEffect(() => {
    if (!id) return;
    
    const teams = JSON.parse(localStorage.getItem('teams') || '[]') as Team[];
    const foundTeam = teams.find(t => t.id === id);
    
    if (foundTeam) {
      setTeam(foundTeam);
    } else {
      navigate('/tim');
    }
    
    // Get matches for this team
    const allMatches = JSON.parse(localStorage.getItem('matches') || '[]') as Match[];
    const teamMatches = allMatches.filter(
      m => m.homeTeamId === id || m.awayTeamId === id
    );
    setMatches(teamMatches);
  }, [id, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPlayerForm({
      ...playerForm,
      [name]: name === 'number' ? parseInt(value) : value
    });
  };

  const addPlayer = () => {
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
    
    // Update in state
    setTeam(updatedTeam);
    
    // Update in localStorage
    const teams = JSON.parse(localStorage.getItem('teams') || '[]') as Team[];
    const updatedTeams = teams.map(t => t.id === team.id ? updatedTeam : t);
    localStorage.setItem('teams', JSON.stringify(updatedTeams));
    
    // Reset form
    setPlayerForm({ name: '', position: '', number: 1 });
    setIsAddingPlayer(false);
  };

  const removePlayer = (playerId: string) => {
    if (!team) return;
    if (!confirm('Yakin ingin menghapus pemain ini?')) return;
    
    const updatedTeam = {
      ...team,
      players: team.players.filter(p => p.id !== playerId)
    };
    
    // Update in state
    setTeam(updatedTeam);
    
    // Update in localStorage
    const teams = JSON.parse(localStorage.getItem('teams') || '[]') as Team[];
    const updatedTeams = teams.map(t => t.id === team.id ? updatedTeam : t);
    localStorage.setItem('teams', JSON.stringify(updatedTeams));
  };

  const getTeamName = (id: string) => {
    const teams = JSON.parse(localStorage.getItem('teams') || '[]') as Team[];
    const team = teams.find(t => t.id === id);
    return team ? team.name : 'Tim tidak ditemukan';
  };

  if (!team) {
    return <div className="text-center py-8">Loading...</div>;
  }

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
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {team.players.map(player => (
                  <tr key={player.id} className={player.isBanned ? 'bg-red-50' : ''}>
                    <td>{player.number}</td>
                    <td>
                      {player.name}
                      {player.isBanned && <span className="text-red-600 text-xs ml-2">(Larangan Bermain)</span>}
                    </td>
                    <td>{player.position}</td>
                    <td>{player.goals}</td>
                    <td>{player.yellowCards}</td>
                    <td>{player.redCards}</td>
                    <td>
                      <button 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => removePlayer(player.id)}
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
                    {getTeamName(match.homeTeamId)} vs {getTeamName(match.awayTeamId)}
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
    </div>
  );
};

export default DetailTim;
