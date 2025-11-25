import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Modal, ScrollView, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import axiosInstance from '../../utils/axios.instance'

const Resources = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [resources, setResources] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selectedResource, setSelectedResource] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    links: [],
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchResources()
  }, [debouncedSearch])

  const fetchResources = async () => {
    try {
      const params = debouncedSearch
        ? `?search=${encodeURIComponent(debouncedSearch)}`
        : ''
      const res = await axiosInstance.get(`/resources${params}`)
      setResources(res.data.resources || res.data || [])
    } catch (e) {
      console.error('Error fetching resources:', e)
      Alert.alert('Error', e.response?.data?.message || 'Failed to fetch resources')
    }
  }

  const handleCreate = () => {
    setModalMode('create')
    setFormData({ title: '', description: '', category: '', links: [] })
    setSelectedResource(null)
    setImageFile(null)
    setImagePreview(null)
    setShowModal(true)
  }

  const handleEdit = (resource) => {
    setModalMode('edit')
    setFormData({
      title: resource.title || '',
      description: resource.description || '',
      category: resource.category || '',
      links: resource.links || [],
    })
    setSelectedResource(resource)
    setImageFile(null)
    setImagePreview(resource.image_url || null)
    setShowModal(true)
  }

  const handleDelete = async (resourceId) => {
    Alert.alert(
      'Delete Resource',
      'Are you sure you want to delete this resource?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axiosInstance.delete(`/resources/${resourceId}`)
              Alert.alert('Success', 'Resource deleted successfully')
              fetchResources()
            } catch (e) {
              console.error('Error deleting resource:', e)
              Alert.alert('Error', e.response?.data?.message || 'Failed to delete resource')
            }
          },
        },
      ]
    )
  }

  const handleSubmit = async () => {
    try {
      let resourceId = selectedResource?.id

      if (modalMode === 'create') {
        const res = await axiosInstance.post('/resources', formData)
        resourceId = res.data.resource?.id || res.data.id
        Alert.alert('Success', 'Resource created successfully')
      } else {
        await axiosInstance.put(`/resources/${resourceId}`, formData)
        Alert.alert('Success', 'Resource updated successfully')
      }

      // Upload image if selected
      if (imageFile && resourceId) {
        await handleImageUpload(resourceId)
      }

      setShowModal(false)
      fetchResources()
    } catch (e) {
      console.error('Error saving resource:', e)
      Alert.alert('Error', e.response?.data?.message || 'Failed to save resource')
    }
  }

  const handleImageUpload = async (resourceId) => {
    try {
      const formData = new FormData()
      formData.append('image', {
        uri: imageFile,
        type: 'image/jpeg',
        name: 'resource.jpg',
      })

      await axiosInstance.post(
        `/resources/${resourceId}/upload-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      Alert.alert('Success', 'Image uploaded successfully')
    } catch (e) {
      console.error('Error uploading image:', e)
      Alert.alert('Error', e.response?.data?.message || 'Failed to upload image')
    }
  }

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleLinksChange = (value) => {
    const linksArray = value
      .split(',')
      .map((link) => link.trim())
      .filter(Boolean)
    setFormData((prev) => ({
      ...prev,
      links: linksArray,
    }))
  }

  const handleImageSelect = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    })

    if (!result.canceled) {
      setImageFile(result.assets[0].uri)
      setImagePreview(result.assets[0].uri)
    }
  }

  const renderResourceItem = ({ item }) => (
    <View className="bg-white rounded-lg p-4 mb-4 shadow">
      <View className="flex-row gap-4">
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            className="w-16 h-16 rounded"
          />
        ) : (
          <View className="w-16 h-16 bg-gray-200 rounded items-center justify-center">
            <Ionicons name="image-outline" size={24} color="#9CA3AF" />
          </View>
        )}

        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900">{item.title}</Text>
          {item.description && (
            <Text className="text-sm text-gray-600 mt-1" numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View className="flex-row items-center mt-2 gap-2">
            {item.category && (
              <View className="bg-blue-100 px-2 py-1 rounded-full">
                <Text className="text-xs font-semibold text-blue-800">
                  {item.category}
                </Text>
              </View>
            )}
            {item.links && item.links.length > 0 && (
              <Text className="text-xs text-gray-600">
                {item.links.length} link(s)
              </Text>
            )}
          </View>
        </View>
      </View>

      <View className="flex-row gap-2 mt-4 pt-4 border-t border-gray-200">
        <TouchableOpacity
          onPress={() => handleEdit(item)}
          className="flex-1 bg-blue-50 py-2 rounded items-center"
        >
          <Ionicons name="pencil" size={18} color="#2563EB" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          className="flex-1 bg-red-50 py-2 rounded items-center"
        >
          <Ionicons name="trash" size={18} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-6">
        <View className="mb-8">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-gray-900">
                Resource Management
              </Text>
              <Text className="text-gray-600 mt-2">
                Manage and organize all resources in the system.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleCreate}
            className="flex-row items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg mt-4"
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-medium">Add Resource</Text>
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <View className="flex-row items-center bg-white border border-gray-300 rounded-lg px-3 py-2">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Search resources..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="flex-1 ml-2 text-base"
            />
          </View>
        </View>
      </View>

      <FlatList
        data={resources}
        renderItem={renderResourceItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="py-8 items-center">
            <Text className="text-gray-500">No resources found</Text>
          </View>
        }
      />

      {/* Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-2xl font-bold text-gray-900">
                {modalMode === 'create' ? 'Create Resource' : 'Edit Resource'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-4">
                {/* Image Upload */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    Image
                  </Text>
                  <View className="flex-row items-center gap-4">
                    {imagePreview && (
                      <Image
                        source={{ uri: imagePreview }}
                        className="w-20 h-20 rounded"
                      />
                    )}
                    <TouchableOpacity
                      onPress={handleImageSelect}
                      className="flex-row items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg"
                    >
                      <Ionicons name="image" size={20} color="#374151" />
                      <Text className="text-gray-700">Choose Image</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </Text>
                  <TextInput
                    value={formData.title}
                    onChangeText={(value) => handleInputChange('title', value)}
                    placeholder="Resource title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    Description
                  </Text>
                  <TextInput
                    value={formData.description}
                    onChangeText={(value) => handleInputChange('description', value)}
                    placeholder="Resource description"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    Category
                  </Text>
                  <TextInput
                    value={formData.category}
                    onChangeText={(value) => handleInputChange('category', value)}
                    placeholder="e.g., Mental Health, Therapy, Articles"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    Links (comma-separated)
                  </Text>
                  <TextInput
                    value={formData.links.join(', ')}
                    onChangeText={handleLinksChange}
                    placeholder="https://example.com, https://example2.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </View>
              </View>

              <View className="flex-row gap-3 mt-6">
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg items-center"
                >
                  <Text className="text-gray-700">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 rounded-lg items-center"
                >
                  <Text className="text-white font-medium">
                    {modalMode === 'create' ? 'Create' : 'Update'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

export default Resources
