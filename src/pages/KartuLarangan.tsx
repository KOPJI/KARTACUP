import React, { useState, useEffect } from 'react';
import { Team, CardStats } from '../types';
import { AlertTriangle, AlertCircle, Ban, Search, Plus, Minus, Check, X } from 'lucide-react';
import { getTeams, updatePlayerCard, togglePlayerBan, getCardStats } from '../utils/firebase';

interface BannedPlayer {
  id: string;
  name: string;
  teamName: string;
  teamId: string;
  position: string;
  number: number;
  yellowCards: number;
  redCards: number;
  isBanned: boolean;
  banReason?: string;
  banDate?: string;
}

const KartuLarangan: React.FC = () => {
  const [bannedPlayers, setBannedPlayers] = useState<BannedPlayer[]>([]);
  const [yellowCardPlayers, setYellowCardPlayers] = useState<BannedPlayer[]>([]);
  const [redCardPlayers, setRedCardPlayers] = useState<BannedPlayer[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<CardStats>({ yellowCards: 0, redCards: 0, bannedPlayers: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const teamsData = await getTeams();
        const cardStats = await getCardStats();
        setStats(cardStats);
        
        const allBannedPlayers: BannedPlayer[] = [];
        const allYellowCardPlayers: BannedPlayer[] = [];
        const allRedCardPlayers: BannedPlayer[] = [];
        
        teamsData.forEach(team => {
          (team.players || []).forEach(player => {
            const playerData = {
              id: player.id,
              name: player.name,
              teamName: team.name,
              teamId: team.id,
              position: player.position,
              number: player.number,
              yellowCards: player.yellowCards || 0,
              redCards: player.redCards || 0,
              isBanned: player.isBanned,
              banReason: player.banReason,
              banDate: player.banDate
            };
            
            if (player.isBanned) {
              allBannedPlayers.push(playerData);
            }
            
            if ((player.yellowCards || 0) > 0) {
              allYellowCardPlayers.push(playerData);
            }
            
            if ((player.redCards || 0) > 0) {
              allRedCardPlayers.push(playerData);
            }
          });
        });
        
        setBannedPlayers(allBannedPlayers);
        setYellowCardPlayers(allYellowCardPlayers);
        setRedCardPlayers(allRedCardPlayers);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleUpdateCard = async (player: BannedPlayer, cardType: 'yellow' | 'red', increment: number) => {
    try {
      await updatePlayerCard(player.teamId, player.id, cardType, increment);
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error("Error updating card:", error);
      alert('Gagal mengupdate kartu pemain');
    }
  };

  const handleToggleBan = async (player: BannedPlayer, shouldBan: boolean) => {
    try {
      await togglePlayerBan(player.teamId, player.id, shouldBan);
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error("Error toggling ban:", error);
      alert('Gagal mengubah status larangan bermain');
    }
  };

  const filteredBannedPlayers = bannedPlayers.filter(player => 
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.teamName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredYellowCardPlayers = yellowCardPlayers.filter(player => 
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.teamName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRedCardPlayers = redCardPlayers.filter(player => 
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.teamName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Ban size={20} />
            <span>Kartu & Larangan Bermain</span>
          </h2>
          <div className="text-sm text-slate-500 mt-1">
            Total: {stats.yellowCards} Kartu Kuning • {stats.redCards} Kartu Merah • {stats.bannedPlayers} Pemain Dilarang
          </div>
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Cari pemain atau tim..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        </div>
      </div>

      <div className="card">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-600">
          <Ban size={20} />
          Pemain dengan Larangan Bermain
        </h3>
        
        {filteredBannedPlayers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama</th>
                  <th>Tim</th>
                  <th>Posisi</th>
                  <th>Kartu Kuning</th>
                  <th>Kartu Merah</th>
                  <th>Alasan</th>
                  <th>Tanggal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredBannedPlayers.map(player => (
                  <tr key={player.id} className="bg-red-50">
                    <td>{player.number}</td>
                    <td>{player.name}</td>
                    <td>{player.teamName}</td>
                    <td>{player.position}</td>
                    <td>{player.yellowCards}</td>
                    <td>{player.redCards}</td>
                    <td>{player.banReason}</td>
                    <td>{player.banDate ? new Date(player.banDate).toLocaleDateString('id-ID') : '-'}</td>
                    <td>
                      <button
                        onClick={() => handleToggleBan(player, false)}
                        className="btn btn-success btn-sm"
                        title="Aktifkan Kembali"
                      >
                        <Check size={16} />
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

      <div className="card">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-amber-600">
          <AlertTriangle size={20} />
          Pemain dengan Kartu Kuning
        </h3>
        
        {filteredYellowCardPlayers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama</th>
                  <th>Tim</th>
                  <th>Posisi</th>
                  <th>Kartu Kuning</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredYellowCardPlayers.map(player => (
                  <tr key={player.id} className={player.isBanned ? 'bg-red-50' : 'bg-amber-50'}>
                    <td>{player.number}</td>
                    <td>{player.name}</td>
                    <td>{player.teamName}</td>
                    <td>{player.position}</td>
                    <td>{player.yellowCards}</td>
                    <td>
                      {player.isBanned ? (
                        <span className="text-red-600 text-xs">Larangan Bermain</span>
                      ) : (
                        <span className="text-amber-600 text-xs">Peringatan</span>
                      )}
                    </td>
                    <td className="space-x-2">
                      <button
                        onClick={() => handleUpdateCard(player, 'yellow', 1)}
                        className="btn btn-warning btn-sm"
                        title="Tambah Kartu Kuning"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => handleUpdateCard(player, 'yellow', -1)}
                        className="btn btn-warning btn-sm"
                        title="Kurangi Kartu Kuning"
                      >
                        <Minus size={16} />
                      </button>
                      {!player.isBanned && (
                        <button
                          onClick={() => handleToggleBan(player, true)}
                          className="btn btn-danger btn-sm"
                          title="Larang Bermain"
                        >
                          <Ban size={16} />
                        </button>
                      )}
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
        
        {filteredRedCardPlayers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama</th>
                  <th>Tim</th>
                  <th>Posisi</th>
                  <th>Kartu Merah</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredRedCardPlayers.map(player => (
                  <tr key={player.id} className="bg-red-50">
                    <td>{player.number}</td>
                    <td>{player.name}</td>
                    <td>{player.teamName}</td>
                    <td>{player.position}</td>
                    <td>{player.redCards}</td>
                    <td>
                      <span className="text-red-600 text-xs">Larangan Bermain</span>
                    </td>
                    <td className="space-x-2">
                      <button
                        onClick={() => handleUpdateCard(player, 'red', 1)}
                        className="btn btn-danger btn-sm"
                        title="Tambah Kartu Merah"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => handleUpdateCard(player, 'red', -1)}
                        className="btn btn-danger btn-sm"
                        title="Kurangi Kartu Merah"
                      >
                        <Minus size={16} />
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
    </div>
  );
};

export default KartuLarangan; 