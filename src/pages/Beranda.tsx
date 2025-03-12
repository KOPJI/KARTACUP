import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Calendar, ChevronRight, Trophy, Users } from 'lucide-react';
import { Match, Team } from '../types';
import { getTeams, getMatches } from '../utils/firebase';

const Beranda: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [topScorers, setTopScorers] = useState<{ name: string; team: string; goals: number }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Load data from Firestore
        const teamsData = await getTeams();
        const matchesData = await getMatches();
        
        // Urutkan tim berdasarkan abjad A-Z
        const sortedTeams = teamsData.sort((a, b) => a.name.localeCompare(b.name));
        setTeams(sortedTeams);
        setMatches(matchesData);
        
        // Calculate top scorers (simplified version for home page)
        const players = teamsData.flatMap(team => 
          (team.players || []).map(player => ({
            name: player.name,
            team: team.name,
            goals: player.goals || 0
          }))
        )
        .filter(player => player.goals > 0)
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 5);
        
        setTopScorers(players);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const upcomingMatches = matches
    .filter(match => match.status === 'scheduled')
    .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
    .slice(0, 5);

  const getTeamName = (id: string) => {
    const team = teams.find(t => t.id === id);
    return team ? team.name : 'Tim Tidak Ditemukan';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-800 to-emerald-700 opacity-90"></div>
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=1920&auto=format')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        ></div>
        <div className="relative p-10 flex flex-col items-center justify-center text-center text-white">
          <Trophy size={84} className="mb-6 text-amber-400 animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Turnamen Sepak Bola Karta Cup V</h1>
          <p className="text-lg text-emerald-100 mb-8 max-w-xl">
            Turnamen sepak bola terbesar dengan tim-tim terbaik dari berbagai daerah
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/jadwal" className="btn bg-white text-teal-900 hover:bg-emerald-50 border border-teal-700 hover:shadow-lg transition-all">
              Lihat Jadwal
            </Link>
            <Link to="/klasemen" className="btn bg-gradient-to-r from-amber-500 to-amber-400 text-white hover:from-amber-600 border border-amber-600 hover:shadow-lg transition-all">
              Lihat Klasemen
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card col-span-2 border-t-4 border-teal-600">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar size={20} className="text-teal-600" />
              Pertandingan Mendatang
            </h2>
            <Link to="/jadwal" className="text-sm text-teal-600 hover:text-teal-800 hover:underline flex items-center">
              Lihat Semua <ChevronRight size={16} />
            </Link>
          </div>
          {upcomingMatches.length > 0 ? (
            <div className="space-y-4">
              {upcomingMatches.map(match => (
                <div key={match.id} className="match-card hover-scale">
                  <div className="flex items-center justify-between mb-3">
                    <div className="badge badge-primary">Grup {match.group}</div>
                    <div className="flex items-center gap-2 text-sm text-emerald-600">
                      <Calendar size={14} />
                      <span>{match.date || 'Jadwal belum ditentukan'}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div>
                      <div className="font-semibold mt-1 text-lg">
                        {getTeamName(match.homeTeamId)} vs {getTeamName(match.awayTeamId)}
                      </div>
                      <div className="text-sm text-emerald-600 mt-1">{match.venue}</div>
                    </div>
                    
                    <div className="mt-4 sm:mt-0">
                      <Link 
                        to={`/pertandingan/${match.id}`} 
                        className="btn btn-outline text-sm"
                      >
                        Detail
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-emerald-500 bg-emerald-50 rounded-lg">
              <Calendar size={48} className="mx-auto mb-3 text-emerald-400" />
              <p className="font-medium">Belum ada jadwal pertandingan</p>
            </div>
          )}
        </div>

        <div className="card border-t-4 border-amber-500">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Award size={20} className="text-amber-500" />
              Top Pencetak Gol
            </h2>
            <Link to="/pencetak-gol" className="text-sm text-teal-600 hover:text-teal-800 hover:underline flex items-center">
              Lihat Semua <ChevronRight size={16} />
            </Link>
          </div>
          {topScorers.length > 0 ? (
            <div className="space-y-3">
              {topScorers.map((scorer, index) => (
                <div key={index} className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-emerald-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      index === 0 ? 'bg-amber-500' : 
                      index === 1 ? 'bg-slate-400' : 
                      index === 2 ? 'bg-amber-700' : 'bg-teal-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{scorer.name}</div>
                      <div className="text-xs text-emerald-600">{scorer.team}</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-amber-500">{scorer.goals}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-emerald-500 bg-emerald-50 rounded-lg">
              <Award size={48} className="mx-auto mb-3 text-amber-400" />
              <p className="font-medium">Belum ada data pencetak gol</p>
            </div>
          )}
        </div>
      </div>

      <div className="card border border-emerald-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users size={20} className="text-teal-600" />
            Tim Peserta
          </h2>
          <Link to="/tim" className="text-sm text-teal-600 hover:text-teal-800 hover:underline flex items-center">
            Lihat Semua <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {teams.slice(0, 8).map(team => (
            <Link key={team.id} to={`/tim/${team.id}`} className="team-card hover-scale">
              <div className="font-semibold mb-1 text-lg">{team.name}</div>
              <div className="text-sm text-emerald-600">Grup {team.group}</div>
              <div className="mt-2 flex justify-between items-center">
                <div className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                  {team.players.length} Pemain
                </div>
                {team.played > 0 && (
                  <div className="text-xs font-medium">{team.points} Poin</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Beranda;
