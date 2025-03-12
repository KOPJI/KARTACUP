import React, { useState, useEffect } from 'react';
import { Team } from '../types';
import { Award, Medal, Search } from 'lucide-react';

interface TopScorer {
  id: string;
  name: string;
  teamName: string;
  teamId: string;
  goals: number;
}

const PencetakGol: React.FC = () => {
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const teamsData = JSON.parse(localStorage.getItem('teams') || '[]') as Team[];
    
    // Create list of all players with their goals
    const allScorers: TopScorer[] = [];
    
    teamsData.forEach(team => {
      team.players.forEach(player => {
        if (player.goals > 0) {
          allScorers.push({
            id: player.id,
            name: player.name,
            teamName: team.name,
            teamId: team.id,
            goals: player.goals
          });
        }
      });
    });
    
    // Sort by goals (descending)
    allScorers.sort((a, b) => b.goals - a.goals);
    
    setTopScorers(allScorers);
  }, []);

  const filteredScorers = topScorers.filter(scorer => 
    scorer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scorer.teamName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Award size={20} />
          <span>Daftar Pencetak Gol</span>
        </h2>
        
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
      
      {filteredScorers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScorers.map((scorer, index) => (
            <div key={scorer.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                  index === 0 ? 'bg-amber-500' : 
                  index === 1 ? 'bg-slate-400' : 
                  index === 2 ? 'bg-amber-700' : 'bg-blue-600'
                }`}>
                  {index === 0 ? (
                    <Medal size={24} />
                  ) : (
                    <span className="text-xl font-bold">{index + 1}</span>
                  )}
                </div>
                
                <div>
                  <div className="font-bold text-lg">{scorer.name}</div>
                  <div className="text-sm text-slate-500">{scorer.teamName}</div>
                </div>
                
                <div className="ml-auto">
                  <div className="text-3xl font-bold">{scorer.goals}</div>
                  <div className="text-xs text-slate-500 text-right">Gol</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <Award size={48} className="mx-auto mb-3 text-slate-300" />
          {searchTerm ? (
            <p>Tidak ada pemain yang ditemukan</p>
          ) : (
            <p>Belum ada data pencetak gol</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PencetakGol;
