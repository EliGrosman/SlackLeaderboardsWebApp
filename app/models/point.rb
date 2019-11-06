class Point < ApplicationRecord
  belongs_to :board

  before_create :create_unique_identifier

  def create_unique_identifier
    loop do
      self.code = SecureRandom.hex(5) 
      break unless self.class.exists?(:code => code)
    end
  end
end
