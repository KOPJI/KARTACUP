import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Team } from '../types';
import { Plus, Search, Users } from 'lucide-react';
import { getTeams, saveTeam } from '../utils/firebase';

const DaftarTim: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const teamsData = await getTeams();
        
        // Urutkan tim berdasarkan abjad A-Z
        const sortedTeams = teamsData.sort((a, b) => a.name.localeCompare(b.name));
        setTeams(sortedTeams);
        
        // Extract unique group names
        const uniqueGroups = Array.from(new Set(teamsData.map((team: Team) => team.group)));
        setGroups(uniqueGroups);
      } catch (error) {
        console.error("Error fetching teams:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const filteredTeams = teams.filter(team => {
    const matchesGroup = activeGroup === 'all' || team.group === activeGroup;
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const handleAddTeam = async () => {
    const teamName = prompt('Masukkan nama tim:');
    if (!teamName) return;
    
    const groupName = prompt('Masukkan grup (A, B, C, D):');
    if (!groupName || !['A', 'B', 'C', 'D'].includes(groupName)) {
      alert('Grup harus A, B, C, atau D');
      return;
    }
    
    const newTeam: Team = {
      id: Date.now().toString(),
      name: teamName,
      group: groupName,
      players: [],
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0
    };
    
    try {
      // Simpan ke Firestore
      await saveTeam(newTeam);
      
      // Update state
      const updatedTeams = [...teams, newTeam].sort((a, b) => a.name.localeCompare(b.name));
      setTeams(updatedTeams);
      
      if (!groups.includes(groupName)) {
        setGroups([...groups, groupName]);
      }
      
      alert('Tim berhasil ditambahkan');
    } catch (error) {
      console.error("Error adding team:", error);
      alert('Gagal menambahkan tim');
    }
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
        <div className="relative">
          <input
            type="text"
            placeholder="Cari tim..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        </div>
        
        <button 
          className="btn btn-primary inline-flex items-center gap-2"
          onClick={handleAddTeam}
        >
          <Plus size={18} />
          <span>Tambah Tim</span>
        </button>
      </div>
      
      <div className="flex border-b overflow-x-auto">
        <button
          className={`tab ${activeGroup === 'all' ? 'tab-active' : ''}`}
          onClick={() => setActiveGroup('all')}
        >
          Semua Tim
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTeams.map(team => (
          <Link
            key={team.id}
            to={`/tim/${team.id}`}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="badge badge-primary inline-flex items-center">
                <span>Grup {team.group}</span>
              </div>
              <div className="text-sm text-slate-500">
                {team.players.length} Pemain
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-10 h-10 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center">
                <Users size={20} />
              </div>
              <div>
                <h3 className="font-bold">{team.name}</h3>
                <div className="text-sm text-slate-500 mt-1">
                  {team.played > 0 ? (
                    <span>{team.points} Poin • {team.won}M {team.drawn}S {team.lost}K</span>
                  ) : (
                    <span>Belum bertanding</span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {filteredTeams.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <Users size={48} className="mx-auto mb-3 text-slate-300" />
          <p>Tidak ada tim yang ditemukan</p>
        </div>
      )}
    </div>
  );
};

export default DaftarTim;
