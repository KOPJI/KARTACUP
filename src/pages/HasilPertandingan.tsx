import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Match, Team } from '../types';
import { Calendar, CircleCheck, Clock } from 'lucide-react';

const HasilPertandingan: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTab, setActiveTab] = useState<'completed' | 'scheduled'>('scheduled');

  useEffect(() => {
    const teamsData = JSON.parse(localStorage.getItem('teams') || '[]');
    const matchesData = JSON.parse(localStorage.getItem('matches') || '[]');
    
    setTeams(teamsData);
    setMatches(matchesData);
  }, []);

  const getTeamName = (id: string) => {
    const team = teams.find(t => t.id === id);
    return team ? team.name : 'Tim tidak ditemukan';
  };

  const completedMatches = matches.filter(match => match.status === 'completed')
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  
  const scheduledMatches = matches.filter(match => match.status === 'scheduled' && match.date)
    .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

  return (
    <div className="space-y-6">
      <div className="flex border-b">
        <button
          className={`tab ${activeTab === 'scheduled' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('scheduled')}
        >
          Pertandingan Mendatang
        </button>
        <button
          className={`tab ${activeTab === 'completed' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Hasil Pertandingan
        </button>
      </div>
      
      {activeTab === 'scheduled' && (
        <>
          {scheduledMatches.length > 0 ? (
            <div className="space-y-4">
              {scheduledMatches.map(match => (
                <div key={match.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="badge badge-primary">Grup {match.group}</div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar size={14} />
                      <span>{match.date}</span>
                      <Clock size={14} className="ml-2" />
                      <span>{match.time || '--:--'}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold">
                        {getTeamName(match.homeTeamId)} vs {getTeamName(match.awayTeamId)}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">{match.venue}</div>
                    </div>
                    
                    <div className="mt-4 md:mt-0">
                      <Link 
                        to={`/pertandingan/${match.id}`}
                        className="btn btn-primary"
                      >
                        Input Hasil
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Calendar size={48} className="mx-auto mb-3 text-slate-300" />
              {matches.length === 0 ? (
                <p>Belum ada jadwal pertandingan</p>
              ) : (
                <p>Belum ada pertandingan mendatang</p>
              )}
            </div>
          )}
        </>
      )}
      
      {activeTab === 'completed' && (
        <>
          {completedMatches.length > 0 ? (
            <div className="space-y-4">
              {completedMatches.map(match => (
                <div key={match.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="badge badge-primary">Grup {match.group}</div>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <CircleCheck size={14} />
                      <span>Selesai</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold">
                        {getTeamName(match.homeTeamId)} vs {getTeamName(match.awayTeamId)}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        {match.date} • {match.time || '--:--'}
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 flex items-center gap-6">
                      <div className="text-2xl font-bold">
                        {match.homeScore} - {match.awayScore}
                      </div>
                      <Link 
                        to={`/pertandingan/${match.id}`}
                        className="btn btn-outline"
                      >
                        Detail
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <CircleCheck size={48} className="mx-auto mb-3 text-slate-300" />
              <p>Belum ada hasil pertandingan</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HasilPertandingan;
