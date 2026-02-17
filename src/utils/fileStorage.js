const fs = require('fs').promises;
const path = require('path');

class FileStorage {
  constructor(dataFilePath) {
    this.dataFilePath = dataFilePath;
  }

  async readFile() {
    try {
      const data = await fs.readFile(this.dataFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { files: [] };
      }
      throw error;
    }
  }

  async writeFile(data) {
    await fs.writeFile(this.dataFilePath, JSON.stringify(data, null, 2), 'utf8');
  }

  async addFile(fileInfo) {
    const data = await this.readFile();
    data.files.push({
      id: Date.now().toString(),
      ...fileInfo,
      isPublic: fileInfo.isPublic !== undefined ? fileInfo.isPublic : false,
      publicPath: fileInfo.publicPath !== undefined ? fileInfo.publicPath : null,
      accessCount: 0,
      accessHistory: [],
      uploadTime: new Date().toISOString()
    });
    await this.writeFile(data);
    return data.files[data.files.length - 1];
  }

  async getFileById(id) {
    const data = await this.readFile();
    return data.files.find(file => file.id === id);
  }

  async getFileByPath(filePath) {
    const data = await this.readFile();
    return data.files.find(file => file.path === filePath);
  }

  async getAllFiles() {
    const data = await this.readFile();
    return data.files;
  }

  async deleteFile(id) {
    const data = await this.readFile();
    const fileIndex = data.files.findIndex(file => file.id === id);
    if (fileIndex === -1) {
      return false;
    }
    const file = data.files[fileIndex];
    try {
      await fs.unlink(file.path);
    } catch (error) {
      console.error('删除物理文件失败:', error.message);
    }
    data.files.splice(fileIndex, 1);
    await this.writeFile(data);
    return true;
  }

  async updateFile(id, updates) {
    const data = await this.readFile();
    const fileIndex = data.files.findIndex(file => file.id === id);
    if (fileIndex === -1) {
      return null;
    }
    data.files[fileIndex] = {
      ...data.files[fileIndex],
      ...updates,
      updateTime: new Date().toISOString()
    };
    await this.writeFile(data);
    return data.files[fileIndex];
  }

  async recordAccess(id, ipAddress = null, userAgent = null) {
    const data = await this.readFile();
    const fileIndex = data.files.findIndex(file => file.id === id);
    if (fileIndex === -1) {
      return false;
    }
    data.files[fileIndex].accessCount = (data.files[fileIndex].accessCount || 0) + 1;
    if (!data.files[fileIndex].accessHistory) {
      data.files[fileIndex].accessHistory = [];
    }
    data.files[fileIndex].accessHistory.push({
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent
    });
    await this.writeFile(data);
    return true;
  }

  async getAccessStatistics(id, days = 7) {
    const file = await this.getFileById(id);
    if (!file || !file.accessHistory) {
      return null;
    }
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentAccess = file.accessHistory.filter(
      access => new Date(access.timestamp) >= cutoffDate
    );

    const dailyStats = {};
    recentAccess.forEach(access => {
      const date = new Date(access.timestamp).toISOString().split('T')[0];
      dailyStats[date] = (dailyStats[date] || 0) + 1;
    });

    const stats = {
      totalAccess: recentAccess.length,
      uniqueDays: Object.keys(dailyStats).length,
      averagePerDay: Object.keys(dailyStats).length > 0 
        ? (recentAccess.length / Object.keys(dailyStats).length).toFixed(2)
        : 0,
      dailyStats: dailyStats,
      trend: this.calculateTrend(dailyStats)
    };

    return stats;
  }

  calculateTrend(dailyStats) {
    const dates = Object.keys(dailyStats).sort();
    if (dates.length < 2) {
      return 'stable';
    }
    const firstHalf = dates.slice(0, Math.floor(dates.length / 2));
    const secondHalf = dates.slice(Math.floor(dates.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, date) => sum + dailyStats[date], 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, date) => sum + dailyStats[date], 0) / secondHalf.length;
    
    if (secondHalfAvg > firstHalfAvg * 1.2) {
      return 'increasing';
    } else if (secondHalfAvg < firstHalfAvg * 0.8) {
      return 'decreasing';
    }
    return 'stable';
  }

  async getPublicFileByPath(publicPath) {
    const data = await this.readFile();
    return data.files.find(file => file.isPublic && file.publicPath === publicPath);
  }

  async getAllPublicFiles() {
    const data = await this.readFile();
    return data.files.filter(file => file.isPublic);
  }
}

module.exports = FileStorage;