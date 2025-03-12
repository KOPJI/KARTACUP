import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Match, Team } from '../types';
import { ArrowRight, Calendar, Clock, Info, RotateCw, Square, Trash, Database } from 'lucide-react';
import { generateSchedule } from '../utils/dataInitializer';
import { getMatches, getTeams, deleteMatch, formatDateToIndonesian, saveMatch, deleteAllMatches, initializeTeamsData, initializePlayersData } from '../utils/firebase';

const Jadwal: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [groups, setGroups] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [generatingSchedule, setGeneratingSchedule] = useState<boolean>(false);
  const [initializingData, setInitializingData] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const teamsData = await getTeams();
        const matchesData = await getMatches();
        
        setTeams(teamsData);
        setMatches(matchesData);
        
        // Extract unique group names
        const uniqueGroups = Array.from(new Set(teamsData.map((team: Team) => team.group)));
        setGroups(uniqueGroups);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleInitializeData = async () => {
    if (!confirm('Inisialisasi data tim akan menghapus semua data tim yang ada dan membuat data baru. Lanjutkan?')) {
      return;
    }
    
    try {
      setInitializingData(true);
      
      // Inisialisasi data tim
      await initializeTeamsData();
      
      // Inisialisasi data pemain
      await initializePlayersData();
      
      // Reload data
      const teamsData = await getTeams();
      setTeams(teamsData);
      
      alert("Data tim berhasil diinisialisasi. Sekarang Anda dapat membuat jadwal pertandingan.");
    } catch (error) {
      console.error("Error initializing data:", error);
      alert("Gagal menginisialisasi data: " + (error instanceof Error ? error.message : "Error tidak diketahui"));
    } finally {
      setInitializingData(false);
    }
  };

  const handleGenerateSchedule = async () => {
    if (matches.length > 0) {
      if (!confirm('Jadwal sudah ada. Generate ulang jadwal pertandingan?')) {
        return;
      }
    }
    
    try {
      setGeneratingSchedule(true);
      
      // Make sure we have the latest teams data
      const freshTeamsData = await getTeams();
      setTeams(freshTeamsData);
      
      if (freshTeamsData.length === 0) {
        alert("Tidak dapat membuat jadwal: data tim tidak ditemukan");
        return;
      }
      
      // Generate jadwal baru dengan tanggal mulai yang ditentukan
      const newMatches = await generateSchedule(startDate, freshTeamsData);
      
      if (newMatches && newMatches.length > 0) {
        // Update venue name for all matches
        const updatedMatches = newMatches.map((match: Match) => ({
          ...match,
          venue: "Lapangan Gelora Babakan Girihieum"
        }));
        
        // Save each match to Firestore
        for (const match of updatedMatches) {
          await saveMatch(match);
        }
        
        // Reload matches
        setMatches(updatedMatches);
        alert("Jadwal pertandingan berhasil dibuat");
      } else {
        alert("Gagal membuat jadwal. Pastikan data tim sudah diinisialisasi dengan benar.");
      }
    } catch (error) {
      console.error("Error generating schedule:", error);
      alert("Gagal membuat jadwal pertandingan: " + (error instanceof Error ? error.message : "Error tidak diketahui"));
    } finally {
      setGeneratingSchedule(false);
    }
  };

  const updateMatchDate = async (matchId: string, date: string, time: string) => {
    try {
      const updatedMatches = matches.map(match => {
        if (match.id === matchId) {
          return { ...match, date, time };
        }
        return match;
      });
      
      // Find the updated match
      const updatedMatch = updatedMatches.find(m => m.id === matchId);
      if (!updatedMatch) return;
      
      // Save to Firestore
      await saveMatch(updatedMatch);
      
      // Update local state
      setMatches(updatedMatches);
    } catch (error) {
      console.error("Error updating match date:", error);
      alert("Gagal memperbarui jadwal pertandingan");
    }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm('Yakin ingin menghapus jadwal pertandingan ini?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      // Delete from Firestore
      await deleteMatch(id);
      
      // Update local state
      const updatedMatches = matches.filter(match => match.id !== id);
      setMatches(updatedMatches);
    } catch (error) {
      console.error("Error deleting match:", error);
      alert("Gagal menghapus jadwal pertandingan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllMatches = async () => {
    setShowDeleteConfirmation(false);
    
    try {
      setIsLoading(true);
      // Delete all matches from Firestore
      await deleteAllMatches();
      
      // Clear local state
      setMatches([]);
      
      alert("Semua jadwal pertandingan berhasil dihapus");
    } catch (error) {
      console.error("Error deleting all matches:", error);
      alert("Gagal menghapus semua jadwal pertandingan");
    } finally {
      setIsLoading(false);
    }
  };

  const getTeamName = (id: string) => {
    const team = teams.find(t => t.id === id);
    return team ? team.name : 'Tim tidak ditemukan';
  };

  // Kelompokkan pertandingan berdasarkan tanggal
  const groupMatchesByDate = () => {
    const grouped: { [date: string]: Match[] } = {};
    
    filteredMatches.forEach(match => {
      const date = match.date || 'Belum Dijadwalkan';
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(match);
    });
    
    // Urutkan tanggal
    return Object.keys(grouped)
      .sort((a, b) => {
        // "Belum Dijadwalkan" selalu di akhir
        if (a === 'Belum Dijadwalkan') return 1;
        if (b === 'Belum Dijadwalkan') return -1;
        return new Date(a).getTime() - new Date(b).getTime();
      })
      .map(date => ({
        date,
        matches: grouped[date].sort((a, b) => {
          if (!a.time) return 1;
          if (!b.time) return -1;
          return a.time.localeCompare(b.time);
        })
      }));
  };

  const filteredMatches = matches.filter(match => 
    activeGroup === 'all' || match.group === activeGroup
  );

  const groupedMatches = groupMatchesByDate();

  // Latar belakang untuk slot waktu berbeda
  const getTimeSlotColor = (time: string) => {
    if (!time) return 'bg-slate-100';
    if (time.startsWith('13:30')) return 'bg-emerald-50';
    if (time.startsWith('14:45')) return 'bg-blue-50';
    if (time.startsWith('16:00')) return 'bg-amber-50';
    return 'bg-slate-100';
  };

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
        <h2 className="text-xl font-bold">Jadwal Pertandingan</h2>
        <div className="flex gap-2 items-center">
          <button 
            className="text-teal-700 hover:text-teal-800 p-2 rounded-full bg-teal-50 hover:bg-teal-100"
            onClick={() => setShowInfoModal(true)}
          >
            <Info size={20} />
          </button>
          <button 
            className={`btn btn-primary inline-flex items-center gap-2 ${initializingData ? 'opacity-70 cursor-not-allowed' : ''}`}
            onClick={handleInitializeData}
            disabled={initializingData}
          >
            {initializingData ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                <span>Inisialisasi Data...</span>
              </>
            ) : (
              <>
                <Database size={18} />
                <span>Inisialisasi Data</span>
              </>
            )}
          </button>
          <button 
            className={`btn btn-primary inline-flex items-center gap-2 ${generatingSchedule ? 'opacity-70 cursor-not-allowed' : ''}`}
            onClick={handleGenerateSchedule}
            disabled={generatingSchedule}
          >
            {generatingSchedule ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                <span>Membuat Jadwal...</span>
              </>
            ) : (
              <>
                <RotateCw size={18} />
                <span>{matches.length > 0 ? 'Generate Ulang Jadwal' : 'Generate Jadwal'}</span>
              </>
            )}
          </button>
          {matches.length > 0 && (
            <button 
              className="btn bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-2"
              onClick={() => setShowDeleteConfirmation(true)}
            >
              <Trash size={18} />
              <span>Hapus Jadwal</span>
            </button>
          )}
        </div>
      </div>
      
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">Informasi Penjadwalan</h3>
            <div className="space-y-3 text-sm">
              <p>Sistem penjadwalan menggunakan prinsip berikut:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Setiap tim akan bertemu semua tim lain dalam grup yang sama (round-robin)</li>
                <li>Setiap tim mendapatkan waktu istirahat minimal 1 hari antar pertandingan</li>
                <li>Jadwal pertandingan terdiri dari 3 slot waktu tetap setiap hari:
                  <ul className="list-disc pl-5 mt-1">
                    <li className="text-emerald-700">Pertandingan 1: 13:30 - 14:35</li>
                    <li className="text-blue-700">Pertandingan 2: 14:45 - 15:50</li>
                    <li className="text-amber-700">Pertandingan 3: 16:00 - 17:05</li>
                  </ul>
                </li>
                <li>Pertandingan didistribusikan secara merata antar grup</li>
              </ol>
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                className="btn btn-outline"
                onClick={() => setShowInfoModal(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <div className="flex items-start gap-4">
              <div className="bg-red-100 p-2 rounded-full">
                <Square className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Konfirmasi Hapus Semua Jadwal</h3>
                <p className="text-gray-600 mb-4">
                  Apakah Anda yakin ingin menghapus SEMUA jadwal pertandingan? Tindakan ini akan menghapus semua jadwal 
                  dari database dan tidak dapat dibatalkan. Data hasil pertandingan juga akan terhapus.
                </p>
                <div className="flex justify-end gap-3">
                  <button 
                    className="btn bg-gray-200 hover:bg-gray-300 text-gray-800"
                    onClick={() => setShowDeleteConfirmation(false)}
                  >
                    Batal
                  </button>
                  <button 
                    className="btn bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleDeleteAllMatches}
                  >
                    Hapus Semua
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="card p-4">
        <h3 className="text-lg font-semibold mb-3">Pengaturan Jadwal</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Tanggal Mulai Turnamen</label>
            <input 
              type="date" 
              className="input w-full"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button 
              className={`btn btn-primary w-full sm:w-auto ${generatingSchedule ? 'opacity-70 cursor-not-allowed' : ''}`}
              onClick={handleGenerateSchedule}
              disabled={generatingSchedule}
            >
              {generatingSchedule ? 'Membuat Jadwal...' : 'Buat Jadwal'}
            </button>
          </div>
        </div>
      </div>
      
      {matches.length > 0 && (
        <div className="flex border-b overflow-x-auto">
          <button
            className={`tab ${activeGroup === 'all' ? 'tab-active' : ''}`}
            onClick={() => setActiveGroup('all')}
          >
            Semua Grup
          </button>
          {groups.map(group => (
            <button
              key={group}
              className={`tab ${activeGroup === group ? 'tab-active' : ''}`}
              onClick={() => setActiveGroup(group)}
            >
              Grup {group}
            </button>
          ))}
        </div>
      )}
      
      {groupedMatches.length > 0 ? (
        <div className="space-y-6">
          {groupedMatches.map(({ date, matches }) => (
            <div key={date} className="space-y-2">
              <div className="sticky top-0 z-10 bg-slate-100 py-2 px-4 rounded-md font-medium flex items-center gap-2">
                <Calendar size={18} className="text-teal-600" />
                <span>
                  {date === 'Belum Dijadwalkan' ? date : 
                    formatDateToIndonesian(date)}
                </span>
              </div>
              
              <div className="space-y-3">
                {matches.map(match => (
                  <div 
                    key={match.id} 
                    className={`card hover:shadow-md transition-shadow ${getTimeSlotColor(match.time)}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="badge badge-primary">Grup {match.group}</div>
                      <div className="flex items-center gap-2">
                        {match.status === 'completed' ? (
                          <div className="badge bg-green-100 text-green-800">Selesai</div>
                        ) : (
                          <div className="badge bg-blue-100 text-blue-800">Belum Dimulai</div>
                        )}
                        
                        <button 
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                          onClick={() => handleDeleteMatch(match.id)}
                          title="Hapus Jadwal"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div>
                        <div className="flex items-center mb-3">
                          <Clock size={16} className="text-slate-400 mr-2" />
                          {date === 'Belum Dijadwalkan' ? (
                            <input 
                              type="time" 
                              className="border-b border-dashed border-slate-300 bg-transparent"
                              value={match.time || ''}
                              onChange={(e) => updateMatchDate(match.id, match.date || '', e.target.value)}
                            />
                          ) : (
                            <span className="font-semibold">
                              {match.time || '--:--'} 
                              {match.time && (
                                <span className="text-xs text-slate-500 ml-2">
                                  {match.time.startsWith('13:30') && '(13:30 - 14:35)'}
                                  {match.time.startsWith('14:45') && '(14:45 - 15:50)'}
                                  {match.time.startsWith('16:00') && '(16:00 - 17:05)'}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 mb-1">
                          <div className="font-semibold text-lg">{getTeamName(match.homeTeamId)}</div>
                          <div className="px-2 py-1 rounded-lg bg-white font-bold">VS</div>
                          <div className="font-semibold text-lg">{getTeamName(match.awayTeamId)}</div>
                        </div>
                        
                        <div className="text-sm text-slate-500">{match.venue}</div>
                      </div>
                      
                      <div className="mt-4 md:mt-0">
                        {match.status === 'completed' ? (
                          <div className="text-2xl font-bold bg-white px-3 py-1 rounded-lg shadow-sm">
                            {match.homeScore} - {match.awayScore}
                          </div>
                        ) : (
                          <Link 
                            to={`/pertandingan/${match.id}`}
                            className="btn btn-outline"
                          >
                            Detail
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <Calendar size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="mb-6">Belum ada jadwal pertandingan</p>
          {matches.length === 0 && (
            <button 
              className={`btn btn-primary ${generatingSchedule ? 'opacity-70 cursor-not-allowed' : ''}`}
              onClick={handleGenerateSchedule}
              disabled={generatingSchedule}
            >
              {generatingSchedule ? 'Membuat Jadwal...' : 'Generate Jadwal'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Jadwal;
