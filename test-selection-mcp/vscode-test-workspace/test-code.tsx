// TypeScript React test code for selection injection testing
import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

interface UserListProps {
  users: User[];
  onUserSelect: (user: User) => void;
}

const UserList: React.FC<UserListProps> = ({ users, onUserSelect }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (users.length === 0) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => setIsLoading(false), 1000);
    }
  }, [users]);

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    onUserSelect(user);
  };

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="user-list">
      {users.map(user => (
        <div 
          key={user.id}
          className={`user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
          onClick={() => handleUserClick(user)}
        >
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
      ))}
    </div>
  );
};

export default UserList;
