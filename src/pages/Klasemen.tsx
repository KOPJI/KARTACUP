import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Team, Match } from '../types';
import { CircleAlert, ArrowRight, Info, Trophy } from 'lucide-react';
import { getTeams, getMatches } from '../utils/firebase';

// Type for head-to-head record
interface HeadToHead {
  teamId: string;
  opponentId: string;
  wins: number;
  draws: number;
  losses: number;
}

const Klasemen: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [groups, setGroups] = useState<string[]>([]);
  const [headToHead, setHeadToHead] = useState<HeadToHead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch teams and matches from Firestore
        const teamsData = await getTeams();
        const matchesData = await getMatches();
        
        setTeams(teamsData);
        setMatches(matchesData);
        
        // Extract unique group names
        const uniqueGroups = Array.from(new Set(teamsData.map((team: Team) => team.group)));
        setGroups(uniqueGroups);
        
        // If a group exists, set it as active by default
        if (uniqueGroups.length > 0 && activeGroup === 'all') {
          setActiveGroup(uniqueGroups[0]);
        }
        
        // Calculate head-to-head records
        calculateHeadToHead(matchesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Gagal memuat data klasemen. Silakan coba lagi nanti.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Calculate head-to-head records for all teams
  const calculateHeadToHead = (matchesData: Match[]) => {
    const h2hRecords: HeadToHead[] = [];
    
    // Only use completed matches
    const completedMatches = matchesData.filter(match => 
      match.status === 'completed' && match.homeScore !== null && match.awayScore !== null
    );
    
    completedMatches.forEach(match => {
      const homeTeamId = match.homeTeamId;
      const awayTeamId = match.awayTeamId;
      const homeScore = match.homeScore!;
      const awayScore = match.awayScore!;
      
      // Determine result
      let homeResult: 'win' | 'draw' | 'loss';
      if (homeScore > awayScore) {
        homeResult = 'win';
      } else if (homeScore < awayScore) {
        homeResult = 'loss';
      } else {
        homeResult = 'draw';
      }
      
      // Update home team's record against away team
      updateHeadToHeadRecord(h2hRecords, homeTeamId, awayTeamId, homeResult);
      
      // Update away team's record against home team
      const awayResult = homeResult === 'win' ? 'loss' : homeResult === 'loss' ? 'win' : 'draw';
      updateHeadToHeadRecord(h2hRecords, awayTeamId, homeTeamId, awayResult);
    });
    
    setHeadToHead(h2hRecords);
  };

  // Update or create head-to-head record
  const updateHeadToHeadRecord = (
    records: HeadToHead[], 
    teamId: string, 
    opponentId: string, 
    result: 'win' | 'draw' | 'loss'
  ) => {
    const existingRecord = records.find(r => 
      r.teamId === teamId && r.opponentId === opponentId
    );
    
    if (existingRecord) {
      // Update existing record
      if (result === 'win') {
        existingRecord.wins += 1;
      } else if (result === 'draw') {
        existingRecord.draws += 1;
      } else {
        existingRecord.losses += 1;
      }
    } else {
      // Create new record
      records.push({
        teamId,
        opponentId,
        wins: result === 'win' ? 1 : 0,
        draws: result === 'draw' ? 1 : 0,
        losses: result === 'loss' ? 1 : 0
      });
    }
  };

  // Compare teams head-to-head (return 1 if team A is better, -1 if team B is better, 0 if equal)
  const compareHeadToHead = (teamIdA: string, teamIdB: string): number => {
    // Find direct matches between these teams
    const directMatches = matches.filter(match => 
      match.status === 'completed' && 
      ((match.homeTeamId === teamIdA && match.awayTeamId === teamIdB) || 
       (match.homeTeamId === teamIdB && match.awayTeamId === teamIdA))
    );
    
    if (directMatches.length === 0) {
      return 0; // No head-to-head matches
    }
    
    // Calculate points from direct matches
    let teamAPoints = 0;
    let teamBPoints = 0;
    
    directMatches.forEach(match => {
      const isTeamAHome = match.homeTeamId === teamIdA;
      const teamAScore = isTeamAHome ? match.homeScore! : match.awayScore!;
      const teamBScore = isTeamAHome ? match.awayScore! : match.homeScore!;
      
      if (teamAScore > teamBScore) {
        teamAPoints += 3;
      } else if (teamAScore < teamBScore) {
        teamBPoints += 3;
      } else {
        teamAPoints += 1;
        teamBPoints += 1;
      }
    });
    
    if (teamAPoints > teamBPoints) {
      return 1;
    } else if (teamAPoints < teamBPoints) {
      return -1;
    }
    
    // If points are equal, check goal difference in head-to-head
    let teamAGoals = 0;
    let teamBGoals = 0;
    
    directMatches.forEach(match => {
      const isTeamAHome = match.homeTeamId === teamIdA;
      const teamAScore = isTeamAHome ? match.homeScore! : match.awayScore!;
      const teamBScore = isTeamAHome ? match.awayScore! : match.homeScore!;
      
      teamAGoals += teamAScore;
      teamBGoals += teamBScore;
    });
    
    if (teamAGoals > teamBGoals) {
      return 1;
    } else if (teamAGoals < teamBGoals) {
      return -1;
    }
    
    return 0; // Completely equal
  };

  // Group teams by group
  const teamsByGroup = () => {
    const result: { [group: string]: Team[] } = {};
    
    groups.forEach(group => {
      result[group] = teams
        .filter(team => team.group === group)
        .sort((a, b) => {
          // Sort by points first
          if (a.points !== b.points) {
            return b.points - a.points;
          }
          
          // If points are equal, sort by goal difference
          const aGoalDiff = a.goalsFor - a.goalsAgainst;
          const bGoalDiff = b.goalsFor - b.goalsAgainst;
          if (aGoalDiff !== bGoalDiff) {
            return bGoalDiff - aGoalDiff;
          }
          
          // If goal difference is equal, sort by goals scored
          if (a.goalsFor !== b.goalsFor) {
            return b.goalsFor - a.goalsFor;
          }
          
          // If goals scored are equal, use head-to-head comparison
          const h2hResult = compareHeadToHead(a.id, b.id);
          if (h2hResult !== 0) {
            return -h2hResult; // Negate because we want positive values first
          }
          
          // If everything is equal, sort alphabetically
          return a.name.localeCompare(b.name);
        });
    });
    
    return result;
  };

  const groupedTeams = teamsByGroup();
  
  // General filtered teams (for 'all' view)
  const filteredTeams = teams
    .filter(team => activeGroup === 'all' || team.group === activeGroup)
    .sort((a, b) => {
      // Sort by points first
      if (a.points !== b.points) {
        return b.points - a.points;
      }
      
      // If points are equal, sort by goal difference
      const aGoalDiff = a.goalsFor - a.goalsAgainst;
      const bGoalDiff = b.goalsFor - b.goalsAgainst;
      if (aGoalDiff !== bGoalDiff) {
        return bGoalDiff - aGoalDiff;
      }
      
      // If goal difference is equal, sort by goals scored
      if (a.goalsFor !== b.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }
      
      // If goals scored are equal, use head-to-head comparison
      const h2hResult = compareHeadToHead(a.id, b.id);
      if (h2hResult !== 0) {
        return -h2hResult;
      }
      
      // If everything is equal, sort alphabetically
      return a.name.localeCompare(b.name);
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-lg shadow-md text-red-600">
        <CircleAlert size={64} className="mx-auto mb-3" />
        <p className="text-lg font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-800 to-emerald-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <Trophy size={32} className="text-amber-400" />
          <h2 className="text-2xl font-bold">Klasemen Turnamen</h2>
        </div>
        <p className="text-emerald-100">
          Performa tim dalam turnamen Karta Cup V
        </p>
      </div>
      
      <div className="flex border-b overflow-x-auto bg-white rounded-t-lg shadow-sm">
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
      
      {activeGroup === 'all' ? (
        // Show all groups separately
        <div className="space-y-8">
          {groups.map(group => (
            <div key={group} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-emerald-700 text-white px-4 py-3 flex justify-between items-center">
                <h3 className="font-bold text-lg">Grup {group}</h3>
                <button 
                  className="text-emerald-100 hover:text-white flex items-center text-sm"
                  onClick={() => setActiveGroup(group)}
                >
                  <span>Detail</span>
                  <ArrowRight size={16} className="ml-1" />
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-emerald-100">
                    <tr>
                      <th className="text-center px-4 py-3">Pos</th>
                      <th className="px-4 py-3">Tim</th>
                      <th className="text-center px-4 py-3">JM</th>
                      <th className="text-center px-4 py-3">M</th>
                      <th className="text-center px-4 py-3">S</th>
                      <th className="text-center px-4 py-3">K</th>
                      <th className="text-center px-4 py-3">GM</th>
                      <th className="text-center px-4 py-3">GK</th>
                      <th className="text-center px-4 py-3">SG</th>
                      <th className="text-center px-4 py-3">P</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedTeams[group] && groupedTeams[group].map((team, index) => (
                      <tr key={team.id} className={`
                        ${index % 2 === 0 ? 'bg-white' : 'bg-emerald-50'} 
                        ${index < 2 ? 'hover:bg-amber-50' : 'hover:bg-emerald-100'}
                        transition-colors
                      `}>
                        <td className="text-center font-semibold">
                          {index === 0 && <div className="w-6 h-6 mx-auto bg-amber-500 text-white rounded-full flex items-center justify-center">1</div>}
                          {index === 1 && <div className="w-6 h-6 mx-auto bg-slate-400 text-white rounded-full flex items-center justify-center">2</div>}
                          {index > 1 && <span>{index + 1}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/tim/${team.id}`} className="font-semibold hover:text-teal-700 hover:underline">
                            {team.name}
                          </Link>
                        </td>
                        <td className="text-center">{team.played}</td>
                        <td className="text-center font-medium text-emerald-700">{team.won}</td>
                        <td className="text-center">{team.drawn}</td>
                        <td className="text-center text-red-600">{team.lost}</td>
                        <td className="text-center font-medium text-emerald-700">{team.goalsFor}</td>
                        <td className="text-center text-red-600">{team.goalsAgainst}</td>
                        <td className={`text-center font-medium ${(team.goalsFor - team.goalsAgainst) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {team.goalsFor - team.goalsAgainst}
                        </td>
                        <td className="text-center font-bold text-lg">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-lg">{team.points}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Show selected group
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-emerald-100">
                <tr>
                  <th className="text-center px-4 py-3">Pos</th>
                  <th className="px-4 py-3">Tim</th>
                  <th className="text-center px-4 py-3 whitespace-nowrap">Jumlah Main (JM)</th>
                  <th className="text-center px-4 py-3 whitespace-nowrap">Menang (M)</th>
                  <th className="text-center px-4 py-3 whitespace-nowrap">Seri (S)</th>
                  <th className="text-center px-4 py-3 whitespace-nowrap">Kalah (K)</th>
                  <th className="text-center px-4 py-3 whitespace-nowrap">Gol Masuk (GM)</th>
                  <th className="text-center px-4 py-3 whitespace-nowrap">Gol Kebobolan (GK)</th>
                  <th className="text-center px-4 py-3 whitespace-nowrap">Selisih Gol (SG)</th>
                  <th className="text-center px-4 py-3 whitespace-nowrap">Poin (P)</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.map((team, index) => (
                  <tr key={team.id} className={`
                    ${index % 2 === 0 ? 'bg-white' : 'bg-emerald-50'} 
                    ${index < 2 ? 'hover:bg-amber-50' : 'hover:bg-emerald-100'}
                    transition-colors
                  `}>
                    <td className="text-center font-semibold">
                      {index === 0 && <div className="w-6 h-6 mx-auto bg-amber-500 text-white rounded-full flex items-center justify-center">1</div>}
                      {index === 1 && <div className="w-6 h-6 mx-auto bg-slate-400 text-white rounded-full flex items-center justify-center">2</div>}
                      {index > 1 && <span>{index + 1}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/tim/${team.id}`} className="font-semibold hover:text-teal-700 hover:underline">
                        {team.name}
                      </Link>
                    </td>
                    <td className="text-center">{team.played}</td>
                    <td className="text-center font-medium text-emerald-700">{team.won}</td>
                    <td className="text-center">{team.drawn}</td>
                    <td className="text-center text-red-600">{team.lost}</td>
                    <td className="text-center font-medium text-emerald-700">{team.goalsFor}</td>
                    <td className="text-center text-red-600">{team.goalsAgainst}</td>
                    <td className={`text-center font-medium ${(team.goalsFor - team.goalsAgainst) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {team.goalsFor - team.goalsAgainst}
                    </td>
                    <td className="text-center font-bold text-lg">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-lg">{team.points}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {(activeGroup === 'all' ? filteredTeams.length === 0 : groupedTeams[activeGroup]?.length === 0) && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md text-emerald-500">
          <Trophy size={64} className="mx-auto mb-3 text-emerald-300" />
          <p className="text-lg font-medium">Belum ada data klasemen</p>
          <p className="text-emerald-500 mt-2">Input hasil pertandingan untuk melihat klasemen</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg p-5 shadow-md border-l-4 border-amber-500">
        <div className="flex items-start gap-3">
          <Info size={24} className="text-amber-500 shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold mb-2 text-emerald-900">Keterangan:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-sm">
              <div className="bg-emerald-50 p-2 rounded">JM = Jumlah Main</div>
              <div className="bg-emerald-50 p-2 rounded">M = Menang</div>
              <div className="bg-emerald-50 p-2 rounded">S = Seri</div>
              <div className="bg-emerald-50 p-2 rounded">K = Kalah</div>
              <div className="bg-emerald-50 p-2 rounded">GM = Gol Masuk</div>
              <div className="bg-emerald-50 p-2 rounded">GK = Gol Kebobolan</div>
              <div className="bg-emerald-50 p-2 rounded">SG = Selisih Gol</div>
              <div className="bg-emerald-50 p-2 rounded">P = Poin</div>
            </div>
            <div className="mt-3 text-sm">
              <div className="font-semibold mb-1">Cara Penentuan Urutan:</div>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Jumlah Poin (3 poin untuk menang, 1 poin untuk seri, 0 poin untuk kalah)</li>
                <li>Selisih Gol (SG)</li>
                <li>Jumlah Gol Masuk (GM)</li>
                <li>Head-to-Head (hasil pertandingan langsung antar tim)</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Klasemen;
