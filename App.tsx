import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StatusBar,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {openDatabase} from 'react-native-sqlite-storage';

const db = openDatabase({
  name: 'rn_sqlite',
});

interface Category {
  item?: any;
  deleteCategory?: Function;
  editCategory?: Function;
}

const CategoryItem = ({item, deleteCategory, editCategory}: Category) => {
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(item.name);

  const toggleEdit = () => {
    setEditing(!editing);
  };

  const handleSave = () => {
    editCategory && editCategory(item.id, newName);
    toggleEdit();
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderColor: '#ddd',
      }}>
      <Text style={{marginRight: 9}}>{item.id}</Text>
      {editing ? (
        <>
          <TextInput
            style={{flex: 1}}
            value={newName}
            onChangeText={setNewName}
          />
          <TouchableOpacity onPress={handleSave}>
            <Text>Save</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              flex: 1,
            }}>
            <View>
              <Text>{item.name}</Text>
            </View>
            <View style={{flexDirection: 'row'}}>
              <TouchableOpacity
                style={{marginLeft: 10, paddingHorizontal: 5}}
                onPress={toggleEdit}>
                <Text>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{marginLeft: 10, paddingHorizontal: 5}}
                onPress={() => deleteCategory && deleteCategory(item.id)}>
                <Text>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const App = () => {
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);

  const createTables = () => {
    db.transaction(data => {
      data.executeSql(
        `CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(20))`,
        [],
        (sqldata, res) => {
          console.log('table created successfully');
        },
        error => {
          console.log('error on creating table ' + error.message);
        },
      );
    });
  };

  const addCategory = () => {
    if (!category) {
      alert('Enter category');
      return false;
    }

    db.transaction(data => {
      data.executeSql(
        `INSERT INTO categories (name) VALUES (?)`,
        [category],
        (sqldata, res) => {
          console.log(`${category} category added successfully`);
          getCategories();
          setCategory('');
        },
        error => {
          console.log('error on adding category ' + error.message);
        },
      );
    });
  };

  const getCategories = () => {
    db.transaction(data => {
      data.executeSql(
        `SELECT * FROM categories ORDER BY id DESC`,
        [],
        (sqldata, res) => {
          console.log('categories retrieved successfully');
          let len = res.rows.length;

          if (len > 0) {
            let results = [];
            for (let i = 0; i < len; i++) {
              let item = res.rows.item(i);
              results.push({id: item.id, name: item.name});
            }

            setCategories(results);
          }
        },
        error => {
          console.log('error on getting categories ' + error.message);
        },
      );
    });
  };

  const deleteCategory = categoryId => {
    db.transaction(data => {
      data.executeSql(
        `DELETE FROM categories WHERE id = ?`,
        [categoryId],
        (sqldata, res) => {
          console.log(`Category with ID ${categoryId} deleted successfully`);
          getCategories(); // Refresh the category list
        },
        error => {
          console.log('Error deleting category: ' + error.message);
        },
      );
    });
  };

  const editCategory = (categoryId, newName) => {
    if (!newName) {
      alert('Enter a new category name');
      return;
    }

    db.transaction(data => {
      data.executeSql(
        `UPDATE categories SET name = ? WHERE id = ?`,
        [newName, categoryId],
        (sqldata, res) => {
          console.log(`Category with ID ${categoryId} updated successfully`);
          getCategories(); // Refresh the category list
        },
        error => {
          console.log('Error updating category: ' + error.message);
        },
      );
    });
  };

  useEffect(async () => {
    await createTables();
    await getCategories();
  }, []);

  return (
    <View>
      <StatusBar backgroundColor="#222" />

      <TextInput
        placeholder="Enter category"
        value={category}
        onChangeText={setCategory}
        style={{marginHorizontal: 8}}
      />

      <Button title="Submit" onPress={addCategory} />

      <FlatList
        data={categories}
        renderItem={({item}) => (
          <CategoryItem
            item={item}
            deleteCategory={deleteCategory}
            editCategory={editCategory}
          />
        )}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  );
};

export default App;
